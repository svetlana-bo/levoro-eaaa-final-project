import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const POSTHOG_HOST = "https://us.i.posthog.com";

async function queryPostHog(
  posthogKey: string,
  projectId: string,
  hogql: string,
): Promise<any> {
  const url = `${POSTHOG_HOST}/api/projects/${projectId}/query/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${posthogKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query: hogql,
      },
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("PostHog API error:", res.status, errorData);
    throw {
      source: "posthog",
      status: res.status,
      message: errorData.type || "PostHog API error",
      detail: errorData.detail || `HTTP ${res.status}`,
    };
  }

  return res.json();
}

function buildDateFilter(date_from: string, date_to?: string): string {
  // date_from can be "-30d" style or "2024-01-01" style
  let fromExpr: string;
  const relMatch = date_from.match(/^-(\d+)d$/);
  if (relMatch) {
    fromExpr = `now() - toIntervalDay(${relMatch[1]})`;
  } else {
    fromExpr = `toDateTime('${date_from}')`;
  }

  let toExpr = "now()";
  if (date_to && !date_to.startsWith("-")) {
    toExpr = `toDateTime('${date_to} 23:59:59')`;
  }

  return `timestamp >= ${fromExpr} AND timestamp <= ${toExpr}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check – admin only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: hasRole } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const posthogKey = Deno.env.get("POSTHOG_PERSONAL_API_KEY") || Deno.env.get("POSTHOG_API_KEY");
    if (!posthogKey) {
      return new Response(
        JSON.stringify({ error: "POSTHOG_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const posthogProjectId = Deno.env.get("POSTHOG_PROJECT_ID");
    if (!posthogProjectId) {
      return new Response(
        JSON.stringify({ error: "POSTHOG_PROJECT_ID not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { metric, date_from, date_to } = await req.json();

    if (!metric || !date_from) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: metric, date_from" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const dateFilter = buildDateFilter(date_from, date_to);
    let hogql: string;

    switch (metric) {
      case "pageviews_trend":
        hogql = `
          SELECT
            toDate(timestamp) AS day,
            count() AS pageviews,
            count(DISTINCT distinct_id) AS visitors
          FROM events
          WHERE event = '$pageview' AND ${dateFilter}
          GROUP BY day
          ORDER BY day
        `;
        break;

      case "countries":
        hogql = `
          SELECT
            properties.$geoip_country_code AS country_code,
            count(DISTINCT distinct_id) AS visitors
          FROM events
          WHERE event = '$pageview' AND ${dateFilter}
            AND properties.$geoip_country_code IS NOT NULL
            AND properties.$geoip_country_code != ''
          GROUP BY country_code
          ORDER BY visitors DESC
          LIMIT 50
        `;
        break;

      case "top_pages":
        hogql = `
          SELECT
            properties.$current_url AS url,
            count() AS views
          FROM events
          WHERE event = '$pageview' AND ${dateFilter}
            AND properties.$current_url IS NOT NULL
          GROUP BY url
          ORDER BY views DESC
          LIMIT 20
        `;
        break;

      case "referrers":
        hogql = `
          SELECT
            properties.$referring_domain AS referrer,
            count() AS views
          FROM events
          WHERE event = '$pageview' AND ${dateFilter}
            AND properties.$referring_domain IS NOT NULL
            AND properties.$referring_domain != ''
            AND properties.$referring_domain != '$direct'
          GROUP BY referrer
          ORDER BY views DESC
          LIMIT 15
        `;
        break;

      case "devices":
        hogql = `
          SELECT
            properties.$device_type AS device,
            count(DISTINCT distinct_id) AS visitors
          FROM events
          WHERE event = '$pageview' AND ${dateFilter}
            AND properties.$device_type IS NOT NULL
            AND properties.$device_type != ''
          GROUP BY device
          ORDER BY visitors DESC
        `;
        break;

      case "browsers":
        hogql = `
          SELECT
            properties.$browser AS browser,
            count(DISTINCT distinct_id) AS visitors
          FROM events
          WHERE event = '$pageview' AND ${dateFilter}
            AND properties.$browser IS NOT NULL
            AND properties.$browser != ''
          GROUP BY browser
          ORDER BY visitors DESC
          LIMIT 10
        `;
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown metric" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const result = await queryPostHog(posthogKey, posthogProjectId, hogql);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("get-site-analytics error:", err);

    if (err?.source === "posthog") {
      return new Response(
        JSON.stringify({
          error: err.detail || err.message,
          source: "posthog",
          status: err.status,
        }),
        {
          status: err.status || 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
