import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeLinks(html: string): string {
  const normalizeUrl = (raw: string) => {
    let fixed = raw.trim();
    while (/^https?:\/\/https?:\/\//i.test(fixed)) fixed = fixed.replace(/^https?:\/\/(?=https?:\/\/)/i, "");
    fixed = fixed.replace(/^https\/\//i, "https://").replace(/^http\/\//i, "http://");
    if (fixed && !/^(https?:\/\/|mailto:|tel:|#)/i.test(fixed)) fixed = `https://${fixed}`;
    return fixed;
  };
  let result = html.replace(/<a\b([^>]*)href=(['"])([^'"]+)\2([^>]*)>([\s\S]*?)<\/a>/gi, (_, before, quote, href, after, content) => {
    const fixedHref = normalizeUrl(href);
    const fixedContent = String(content).replace(/\b(?:https?:\/\/https?:\/\/|https?:\/\/|https\/\/)[^\s<]+/gi, (url) => normalizeUrl(url));
    return `<a${before}href=${quote}${fixedHref}${quote}${after}>${fixedContent}</a>`;
  });
  const anchors: string[] = [];
  result = result.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (match) => { anchors.push(match); return `__ANCHOR_${anchors.length - 1}__`; });
  result = result.replace(/(^|>)([^<]+)(?=<|$)/g, (_, start, text) => {
    const fixedText = String(text).replace(/\b(?:https?:\/\/https?:\/\/|https?:\/\/|https\/\/)[^\s<]+/gi, (url) => {
      const fixedUrl = normalizeUrl(url);
      return `<a href="${fixedUrl}" target="_blank" rel="noopener noreferrer">${fixedUrl}</a>`;
    });
    return `${start}${fixedText}`;
  });
  return result.replace(/__ANCHOR_(\d+)__/g, (_, index) => anchors[Number(index)]);
}

function getSocialIconHtml(platform: string, url: string): string {
  const iconUrls: Record<string, string> = {
    instagram: "https://cdn.simpleicons.org/instagram/ffffff",
    facebook: "https://cdn.simpleicons.org/facebook/ffffff",
    linkedin: "https://img.icons8.com/ios-filled/50/FFFFFF/linkedin.png",
    tiktok: "https://cdn.simpleicons.org/TikTok/ffffff",
    twitter: "https://cdn.simpleicons.org/x/ffffff",
    youtube: "https://cdn.simpleicons.org/youtube/ffffff",
  };
  const iconUrl = iconUrls[platform];
  if (!iconUrl) return "";
  return `<td style="padding:0 6px;"><a href="${url}" target="_blank" style="display:block;"><img src="${iconUrl}" width="24" height="24" alt="${platform}" style="display:block;border:0;" /></a></td>`;
}

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

async function buildEmailHtml(body: string, template: any, recipientEmail?: string, templateName?: string): Promise<string> {
  const hc = template.header_config || { bgColor: "#1a1a2e", textColor: "#ffffff", showHeader: true };
  const fc = template.footer_config || { bgColor: "#1a1a2e", textColor: "#ffffff", companyName: "Levoro Academy", contactEmail: "info@levoroacademy.com", socialLinks: [], showFooter: true };
  const headerText = template.header_text || "";
  const preheader = template.preheader || "";
  const headerHeight = hc.headerHeight || 180;

  const preheaderHtml = preheader
    ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>`
    : "";

  const headerBgStyle = hc.bgImageUrl ? `background:url('${hc.bgImageUrl}') center/cover no-repeat;` : `background:${hc.bgColor || "#1a1a2e"};`;
  const headerHtml = hc.showHeader !== false
    ? `<div style="${headerBgStyle}color:${hc.textColor || "#fff"};padding:32px 40px;text-align:center;min-height:${headerHeight}px;display:flex;align-items:center;justify-content:center;">${headerText ? `<h1 style="margin:0;font-size:22px;font-weight:700;color:${hc.textColor || "#fff"};">${headerText}</h1>` : ""}</div>`
    : "";

  const socialIconCells = (fc.socialLinks || []).filter((s: any) => s.url).map((s: any) =>
    getSocialIconHtml(s.platform, s.url)
  ).join("");

  const unsubscribeText = fc.unsubscribeText || "You received this email because you signed up on our website or made a purchase from us.";
  const siteUrl = Deno.env.get("SITE_URL") || "https://cozy-dash-portal.lovable.app";
  const unsubSecret = Deno.env.get("UNSUB_SECRET");
  let unsubscribeUrl: string;
  if (recipientEmail && unsubSecret) {
    const token = await hmacSha256Hex(unsubSecret, recipientEmail.toLowerCase().trim());
    unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&token=${token}&source=${encodeURIComponent(templateName || "")}`;
  } else if (recipientEmail) {
    unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&source=${encodeURIComponent(templateName || "")}`;
  } else {
    unsubscribeUrl = fc.unsubscribeUrl || `mailto:${fc.contactEmail || "info@levoroacademy.com"}?subject=Unsubscribe`;
  }

  const footerHtml = fc.showFooter !== false
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${fc.bgColor || "#1a1a2e"};color:${fc.textColor || "#fff"};font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td style="padding:28px 40px 16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;">
                  ${fc.companyName ? `<div style="font-weight:600;font-size:14px;margin-bottom:6px;color:${fc.textColor || "#fff"};">${fc.companyName}</div>` : ""}
                  ${fc.contactEmail ? `<div style="margin-bottom:12px;font-size:13px;"><a href="mailto:${fc.contactEmail}" style="color:${fc.textColor || "#fff"};text-decoration:none;">${fc.contactEmail}</a></div>` : ""}
                  ${socialIconCells ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${socialIconCells}</tr></table>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 40px 28px;border-top:1px solid rgba(255,255,255,0.15);">
            <div style="color:${fc.textColor || "#fff"};opacity:0.8;font-size:12px;line-height:1.6;margin-bottom:10px;">${unsubscribeText}</div>
            <a href="${unsubscribeUrl}" style="color:${fc.textColor || "#fff"};text-decoration:underline;font-size:13px;font-weight:600;">Unsubscribe</a>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    ${preheaderHtml}
    <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      ${headerHtml}
      <div style="padding:32px 40px;color:#333;font-size:15px;line-height:1.6;">${body}</div>
      ${footerHtml}
    </div>
  </body></html>`;
}

async function resolveFirstName(serviceClient: any, email: string): Promise<string> {
  try {
    const { data } = await serviceClient.auth.admin.listUsers({ filter: email, perPage: 50 });
    const user = data?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) return "";
    const { data: profile } = await serviceClient.from("profiles").select("first_name").eq("id", user.id).maybeSingle();
    return profile?.first_name || "";
  } catch {
    return "";
  }
}

function replaceMergeTags(html: string, vars: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "gi"), value);
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return new Response(JSON.stringify({ error: "RESEND_API_KEY is not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const rawBody = await req.json();
    const body = rawBody.data ?? rawBody;
    const { recipients, senderName, senderEmail, flowId, flowNodeId, templateId } = body;
    const subject = (body.subject?.trim() || body.templateTitle?.trim() || "").trim();
    const htmlBodyRaw = (body.htmlBody || "").trim();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) return new Response(JSON.stringify({ error: "recipients array is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!subject || !htmlBodyRaw) return new Response(JSON.stringify({ error: "subject and htmlBody are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let templateRecord: any = null;
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    if (templateId) {
      const { data } = await serviceClient.from("marketing_emails").select("*").eq("id", templateId).single();
      templateRecord = data;
    }

    // Filter out unsubscribed recipients (newsletter_subscribers.is_active = false)
    const normalizedRecipients = Array.from(
      new Set(
        (recipients as string[])
          .filter((e) => typeof e === "string" && e.includes("@"))
          .map((e) => e.toLowerCase().trim())
      )
    );
    const { data: unsubRows } = await serviceClient
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", false)
      .in("email", normalizedRecipients);
    const unsubscribed = new Set((unsubRows || []).map((r: any) => String(r.email).toLowerCase()));
    const deliverableRecipients = normalizedRecipients.filter((e) => !unsubscribed.has(e));
    const skippedUnsubscribed = normalizedRecipients.length - deliverableRecipients.length;

    const resend = new Resend(resendApiKey);
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    const messageIds: Record<string, string | null> = {};

    for (const recipientEmail of deliverableRecipients) {
      const sendId = crypto.randomUUID();
      try {
        // Resolve personalization variables
        const firstName = await resolveFirstName(serviceClient, recipientEmail);
        const mergeVars = { first_name: firstName || "there", email: recipientEmail };

        const personalizedBody = replaceMergeTags(htmlBodyRaw, mergeVars);
        const normalizedBody = normalizeLinks(personalizedBody);
        const fullHtml = templateRecord
          ? await buildEmailHtml(normalizedBody, templateRecord, recipientEmail, subject)
          : normalizedBody;

        const { data, error } = await resend.emails.send({
          from: "Levoro Academy <noreply@app.levoroacademy.com>",
          to: [recipientEmail],
          subject,
          html: fullHtml,
          tags: [
            { name: "send_id", value: sendId },
            ...(flowId ? [{ name: "flow_id", value: flowId }] : []),
            ...(flowNodeId ? [{ name: "node_id", value: flowNodeId }] : []),
          ],
          tracking: { opens: true, clicks: true },
        });

        if (error) {
          failCount++;
          errors.push(`${recipientEmail}: ${error.message || JSON.stringify(error)}`);
        } else {
          successCount++;
          messageIds[recipientEmail] = data?.id || null;
          await serviceClient.from("marketing_email_sends").insert({
            id: sendId, flow_id: flowId || null, flow_node_id: flowNodeId || null, template_id: templateId || null,
            template_name: subject, recipient_email: recipientEmail, resend_message_id: data?.id || null, status: "sent",
            metadata: { sender_name: senderName, sender_email: senderEmail },
          });
          await serviceClient.from("email_events").insert({
            event_type: "sent", email_type: "marketing", recipient_email: recipientEmail, template_name: subject, template_id: templateId || null,
            metadata: { sender_name: senderName, sender_email: senderEmail, resend_id: data?.id, send_id: sendId, flow_id: flowId || null, node_id: flowNodeId || null },
          } as any);
        }
      } catch (e: any) {
        failCount++;
        errors.push(`${recipientEmail}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, successCount, failCount, skippedUnsubscribed, errors: errors.slice(0, 10), messageIds }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
