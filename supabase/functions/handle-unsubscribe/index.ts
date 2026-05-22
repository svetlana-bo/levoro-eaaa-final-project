import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = Deno.env.get("SITE_URL") || "https://cozy-dash-portal.lovable.app";

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token") || "";
    const source = url.searchParams.get("source") || "";
    const confirm = url.searchParams.get("confirm") === "1";
    const action = (url.searchParams.get("action") || "unsubscribe").toLowerCase();

    if (!email) {
      return new Response("<html><body><h2>Invalid unsubscribe link</h2></body></html>", {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Without explicit confirmation, redirect to the in-app preference page (carry token through)
    if (!confirm) {
      const target = `${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&source=${encodeURIComponent(source)}`;
      return new Response(null, { status: 302, headers: { Location: target } });
    }

    // Verify HMAC token to prove ownership of the email address.
    const unsubSecret = Deno.env.get("UNSUB_SECRET");
    if (!unsubSecret) {
      console.error("UNSUB_SECRET not configured");
      return new Response(JSON.stringify({ ok: false, error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const expected = await hmacSha256Hex(unsubSecret, normalizedEmail);
    if (!token || !timingSafeEqual(token.toLowerCase(), expected)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid or missing token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const isResubscribe = action === "resubscribe";

    if (isResubscribe) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .upsert(
          {
            email: normalizedEmail,
            is_active: true,
            unsubscribed_at: null,
            unsubscribe_source: null,
          },
          { onConflict: "email" }
        );

      if (error) console.error("Resubscribe upsert error:", error.message);

      await supabase.from("email_events").insert({
        event_type: "resubscribed",
        email_type: "marketing",
        recipient_email: normalizedEmail,
        template_name: source || "unknown",
        metadata: { source },
      });

      return new Response(JSON.stringify({ ok: true, action: "resubscribed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: unsubscribe — upsert so registered users (not in newsletter table) are also recorded
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email: normalizedEmail,
          is_active: false,
          unsubscribed_at: new Date().toISOString(),
          unsubscribe_source: source || null,
        },
        { onConflict: "email" }
      );

    if (error) console.error("Unsubscribe upsert error:", error.message);

    await supabase.from("email_events").insert({
      event_type: "unsubscribed",
      email_type: "marketing",
      recipient_email: normalizedEmail,
      template_name: source || "unknown",
      metadata: { source },
    });

    return new Response(JSON.stringify({ ok: true, action: "unsubscribed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Unsubscribe error:", e?.message);
    return new Response(JSON.stringify({ ok: false, error: e?.message || "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
