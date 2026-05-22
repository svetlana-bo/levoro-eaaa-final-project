import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const serviceClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: corsHeaders });
    }

    const { sql } = await req.json();
    if (!sql || typeof sql !== "string") {
      return new Response(JSON.stringify({ error: "Missing sql parameter" }), { status: 400, headers: corsHeaders });
    }

    // Validate SELECT only
    const normalized = sql.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim().toUpperCase();
    const forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "GRANT", "REVOKE", "EXECUTE"];
    for (const kw of forbidden) {
      if (normalized.startsWith(kw) || new RegExp(`\\b${kw}\\b`).test(normalized)) {
        return new Response(JSON.stringify({ error: `Only SELECT queries are allowed. Found: ${kw}` }), { status: 400, headers: corsHeaders });
      }
    }

    // Execute with timeout using SUPABASE_DB_URL
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.5/mod.js");
    const pg = postgres(dbUrl, { max: 1 });

    try {
      await pg.unsafe("SET statement_timeout = '10s'");
      const result = await pg.unsafe(sql);
      
      const columns = result.length > 0 ? Object.keys(result[0]) : [];
      const rows = result.map((r: any) => {
        const row: Record<string, any> = {};
        for (const col of columns) {
          row[col] = r[col];
        }
        return row;
      });

      await pg.end();
      return new Response(JSON.stringify({ columns, rows }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (dbErr: any) {
      await pg.end();
      return new Response(JSON.stringify({ error: dbErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
