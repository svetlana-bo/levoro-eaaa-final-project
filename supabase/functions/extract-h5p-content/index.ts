import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedContent {
  title?: string;
  items?: string[];
  description?: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&ldquo;|&#8220;/gi, "“")
    .replace(/&rdquo;|&#8221;/gi, "”")
    .replace(/&lsquo;|&#8216;/gi, "‘")
    .replace(/&rsquo;|&#8217;/gi, "’")
    .replace(/&#8211;/gi, "–")
    .replace(/&#8212;/gi, "—")
    .replace(/&#(\d+);/g, (_match, num) => {
      const parsed = Number(num);
      return Number.isFinite(parsed) ? String.fromCharCode(parsed) : "";
    });
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?\s*>/gi, " ")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function uniqueTexts(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const raw of values) {
    const text = raw.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }

  return output;
}

function toEmbedUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/\/embed(\?.*)?$/i.test(trimmed)) return trimmed;
  return trimmed.replace(/\/?$/, "/embed");
}

function extractFromHtml(html: string): ExtractedContent {
  const titleMatches = [
    ...html.matchAll(/<div[^>]*class=["'][^"']*h5p-question-introduction[^"']*["'][^>]*>[\s\S]*?<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi),
    ...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi),
  ];

  const title = uniqueTexts(titleMatches.map((m) => stripTags(m[1] || "")))[0];

  const answerMatches = [
    ...html.matchAll(/<li[^>]*class=["'][^"']*h5p-answer[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi),
    ...html.matchAll(/<span[^>]*class=["'][^"']*h5p-alternative-inner[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi),
    ...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi),
  ];

  const items = uniqueTexts(
    answerMatches
      .map((m) => stripTags(m[1] || ""))
      .filter((item) => item.length > 1 && !/^check$/i.test(item)),
  );

  return {
    title: title || undefined,
    items: items.length ? items : undefined,
  };
}

async function assertAdmin(req: Request): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.replace("Bearer ", "");

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims?.sub) {
    throw new Error("Unauthorized");
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: isAdmin, error: roleError } = await adminClient.rpc("has_role", {
    _user_id: claimsData.claims.sub,
    _role: "admin",
  });

  if (roleError) throw roleError;
  if (!isAdmin) throw new Error("Forbidden");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await assertAdmin(req);

    const body = await req.json().catch(() => ({}));
    const urls = Array.isArray(body?.urls)
      ? body.urls.filter((url: unknown) => typeof url === "string" && url.trim().length > 0)
      : [];

    if (urls.length === 0) {
      return new Response(JSON.stringify({ results: {}, failures: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, ExtractedContent> = {};
    const failures: Record<string, string> = {};

    await Promise.all(
      urls.map(async (sourceUrl: string) => {
        const targetUrl = toEmbedUrl(sourceUrl);
        try {
          const response = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; LovableImporter/1.0)",
              Accept: "text/html,application/xhtml+xml",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const html = await response.text();
          const extracted = extractFromHtml(html);

          if ((extracted.items?.length ?? 0) === 0 && !extracted.title) {
            failures[sourceUrl] = "No extractable content found";
            return;
          }

          results[sourceUrl] = extracted;
        } catch (err: any) {
          failures[sourceUrl] = err?.message || "Failed to fetch or parse";
        }
      }),
    );

    return new Response(JSON.stringify({ results, failures }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const message = err?.message || "Internal error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
