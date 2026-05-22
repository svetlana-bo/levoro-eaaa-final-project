import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  // Require shared cron secret to prevent unauthenticated mass email triggering.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    console.warn("CRON_SECRET not configured — endpoint is currently unauthenticated");
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const resend = new Resend(resendApiKey);

    const { data: dueRuns, error: runsError } = await supabase
      .from("email_flow_runs").select("*").eq("status", "waiting").lte("wait_until", new Date().toISOString()).limit(100);

    if (runsError) return new Response(JSON.stringify({ error: runsError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!dueRuns || dueRuns.length === 0) return new Response(JSON.stringify({ processed: 0 }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    console.log(`Processing ${dueRuns.length} due flow runs`);
    let processed = 0, sent = 0, errors = 0;

    for (const run of dueRuns) {
      try {
        const { data: currentNode } = await supabase.from("email_flow_nodes").select("*").eq("id", run.flow_node_id).single();
        if (!currentNode) { await supabase.from("email_flow_runs").update({ status: "completed" }).eq("id", run.id); processed++; continue; }

        const conditions = (currentNode.config as any)?.conditions || [];
        if (conditions.length === 0) { await supabase.from("email_flow_runs").update({ status: "completed" }).eq("id", run.id); processed++; continue; }

        let hasOpened = false, hasClicked = false;
        if (run.resend_message_id) {
          const { data: sendRecord } = await supabase.from("marketing_email_sends").select("is_opened, is_clicked, status").eq("resend_message_id", run.resend_message_id).limit(1).maybeSingle();
          if (sendRecord) { hasOpened = !!sendRecord.is_opened; hasClicked = !!sendRecord.is_clicked; }
          else {
            const { data: events } = await supabase.from("email_events").select("event_type").eq("recipient_email", run.recipient_email).in("event_type", ["opened", "clicked"]).gte("created_at", run.created_at).limit(50);
            if (events) for (const evt of events) { if (evt.event_type === "opened") hasOpened = true; if (evt.event_type === "clicked") hasClicked = true; }
          }
        }

        let matchedCondition = null;
        if (hasClicked) matchedCondition = conditions.find((c: any) => c.type === "clicks");
        if (!matchedCondition && hasOpened) matchedCondition = conditions.find((c: any) => c.type === "opens");
        if (!matchedCondition) matchedCondition = conditions.find((c: any) => c.type === "none");

        if (!matchedCondition || !matchedCondition.target_node_id) { await supabase.from("email_flow_runs").update({ status: "completed" }).eq("id", run.id); processed++; continue; }

        const { data: existingRun } = await supabase.from("email_flow_runs").select("id").eq("flow_id", run.flow_id).eq("flow_node_id", matchedCondition.target_node_id).eq("recipient_email", run.recipient_email).limit(1);
        if (existingRun && existingRun.length > 0) { await supabase.from("email_flow_runs").update({ status: "completed" }).eq("id", run.id); processed++; continue; }

        const { data: targetNode } = await supabase.from("email_flow_nodes").select("*").eq("id", matchedCondition.target_node_id).single();
        if (!targetNode) { await supabase.from("email_flow_runs").update({ status: "completed" }).eq("id", run.id); processed++; continue; }

        const targetConfig = targetNode.config as any;
        const emailId = targetConfig?.email_id;
        if (!emailId) { await supabase.from("email_flow_runs").update({ status: "completed" }).eq("id", run.id); processed++; continue; }

        const { data: template } = await supabase.from("marketing_emails").select("*").eq("id", emailId).single();
        if (!template) { await supabase.from("email_flow_runs").update({ status: "failed" }).eq("id", run.id); processed++; errors++; continue; }

        const subject = (template.subject as string)?.trim() || (template.title as string)?.trim() || "";
        const htmlBodyRaw = (template.body as string)?.trim() || "";
        if (!subject || !htmlBodyRaw) { await supabase.from("email_flow_runs").update({ status: "failed" }).eq("id", run.id); processed++; errors++; continue; }

        // Skip if recipient has unsubscribed since the flow started
        const recipientLc = String(run.recipient_email).toLowerCase().trim();
        const { data: unsubRow } = await supabase
          .from("newsletter_subscribers")
          .select("email")
          .eq("email", recipientLc)
          .eq("is_active", false)
          .maybeSingle();
        if (unsubRow) {
          await supabase.from("email_flow_runs").update({ status: "skipped_unsubscribed" }).eq("id", run.id);
          processed++;
          continue;
        }

        // Resolve personalization variables
        const firstName = await resolveFirstName(supabase, run.recipient_email);
        const mergeVars = { first_name: firstName || "there", email: run.recipient_email };
        const personalizedBody = replaceMergeTags(htmlBodyRaw, mergeVars);

        const normalizedBody = normalizeLinks(personalizedBody);
        const fullHtml = await buildEmailHtml(normalizedBody, template, run.recipient_email, subject);
        const sendId = crypto.randomUUID();

        const { data: sendData, error: sendError } = await resend.emails.send({
          from: "Levoro Academy <noreply@app.levoroacademy.com>",
          to: [run.recipient_email],
          subject,
          html: fullHtml,
          tags: [
            { name: "send_id", value: sendId },
            { name: "flow_id", value: run.flow_id },
            { name: "node_id", value: targetNode.id },
            { name: "branch", value: matchedCondition.type },
          ],
          tracking: { opens: true, clicks: true },
        });

        if (sendError) { await supabase.from("email_flow_runs").update({ status: "failed" }).eq("id", run.id); processed++; errors++; continue; }

        await supabase.from("marketing_email_sends").insert({
          id: sendId, flow_id: run.flow_id, flow_node_id: targetNode.id, template_id: emailId,
          template_name: subject, recipient_email: run.recipient_email, resend_message_id: sendData?.id || null, status: "sent",
          metadata: { branch: matchedCondition.type, parent_node_id: run.flow_node_id },
        });

        await supabase.from("email_events").insert({
          event_type: "sent", email_type: "marketing", recipient_email: run.recipient_email, template_name: subject,
          metadata: { resend_id: sendData?.id, send_id: sendId, flow_id: run.flow_id, node_id: targetNode.id, branch: matchedCondition.type },
        });

        await supabase.from("email_flow_runs").update({ status: "completed" }).eq("id", run.id);

        const targetConditions = targetConfig?.conditions || [];
        if (targetConditions.length > 0) {
          const delayDays = targetConfig?.delay_days ?? 1;
          const waitUntil = new Date(Date.now() + (delayDays > 0 ? delayDays * 24 * 60 * 60 * 1000 : 5 * 60 * 1000));
          await supabase.from("email_flow_runs").insert({
            flow_id: run.flow_id, flow_node_id: targetNode.id, recipient_email: run.recipient_email,
            resend_message_id: sendData?.id || null, status: "waiting", wait_until: waitUntil.toISOString(),
          });
        }
        processed++; sent++;
      } catch (e: any) {
        console.error(`Error processing run ${run.id}:`, e.message);
        await supabase.from("email_flow_runs").update({ status: "failed" }).eq("id", run.id);
        processed++; errors++;
      }
    }

    return new Response(JSON.stringify({ processed, sent, errors }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
