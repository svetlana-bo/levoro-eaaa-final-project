import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  thread_id: z.string().uuid(),
  body: z.string().trim().min(1).max(10000),
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildReplyHtml(bodyText: string, headerConfig: any, footerConfig: any, senderName: string, senderEmail: string): string {
  const hc = headerConfig || { bgColor: "#1a1a2e", textColor: "#ffffff", showHeader: true, headerHeight: 120 };
  const fc = footerConfig || { bgColor: "#1a1a2e", textColor: "#ffffff", companyName: "Levoro Academy", contactEmail: senderEmail, showFooter: true };

  const headerHtml = hc.showHeader
    ? `<div style="background:${hc.bgColor};color:${hc.textColor};padding:24px 40px;text-align:center;">
        <h1 style="margin:0;font-size:20px;font-weight:700;color:${hc.textColor};">${senderName}</h1>
      </div>`
    : "";

  const bodyHtml = escapeHtml(bodyText).replace(/\n/g, "<br>");

  const footerHtml = fc.showFooter
    ? `<div style="background:${fc.bgColor};color:${fc.textColor};padding:20px 40px;font-size:13px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
        <div style="font-weight:600;margin-bottom:4px;">${fc.companyName || "Levoro Academy"}</div>
        ${fc.contactEmail ? `<a href="mailto:${fc.contactEmail}" style="color:${fc.textColor};text-decoration:none;">${fc.contactEmail}</a>` : ""}
      </div>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        ${headerHtml}
        <div style="padding:32px 40px;color:#333;font-size:15px;line-height:1.6;">${bodyHtml}</div>
        ${footerHtml}
      </div>
    </body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { thread_id, body } = parsed.data;

    const { data: thread, error: threadErr } = await admin
      .from("contact_threads")
      .select("id, sender_name, sender_email, subject")
      .eq("id", thread_id)
      .maybeSingle();
    if (threadErr || !thread) {
      return new Response(JSON.stringify({ error: "Thread not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await admin.from("email_settings").select("*").limit(1).maybeSingle();
    const senderName = settings?.sender_name || "Levoro Academy";
    const senderEmail = settings?.sender_email || "noreply@app.levoroacademy.com";
    const headerConfig = settings?.welcome_header_config || null;
    const footerConfig = settings?.welcome_footer_config || null;

    const replySubject = thread.subject?.toLowerCase().startsWith("re:")
      ? thread.subject
      : `Re: ${thread.subject || "Your inquiry"}`;

    const html = buildReplyHtml(body, headerConfig, footerConfig, senderName, senderEmail);

    const resend = new Resend(resendApiKey);
    const { data: sendData, error: sendErr } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [thread.sender_email],
      reply_to: senderEmail,
      subject: replySubject,
      html,
    });
    if (sendErr) {
      return new Response(JSON.stringify({ error: sendErr.message || "Failed to send" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();

    await admin.from("contact_messages").insert({
      thread_id,
      direction: "outbound",
      body,
      sender_email: senderEmail,
      sender_name: senderName,
      admin_user_id: userId,
      resend_message_id: (sendData as any)?.id || null,
    });

    await admin
      .from("contact_threads")
      .update({ last_message_at: now, is_read: true })
      .eq("id", thread_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
