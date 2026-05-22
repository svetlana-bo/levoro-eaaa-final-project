// Supabase Send Email Hook — replaces Supabase's default auth emails
// (signup confirmation, email change, etc.) with branded HTML sent via Resend.
//
// Configure in Supabase Dashboard → Authentication → Hooks → "Send Email Hook":
//   URL: https://<project-ref>.supabase.co/functions/v1/auth-email-webhook
//   Secret: paste the v1, whsec_... value into the SEND_EMAIL_HOOK_SECRET secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp",
};

function getSocialIconImg(platform: string): string {
  const iconUrls: Record<string, string> = {
    instagram: "https://cdn.simpleicons.org/instagram/ffffff",
    facebook: "https://cdn.simpleicons.org/facebook/ffffff",
    linkedin: "https://img.icons8.com/ios-filled/50/FFFFFF/linkedin.png",
    tiktok: "https://cdn.simpleicons.org/TikTok/ffffff",
    twitter: "https://cdn.simpleicons.org/x/ffffff",
    youtube: "https://cdn.simpleicons.org/youtube/ffffff",
  };
  return iconUrls[platform] || "";
}

function buildEmailHtml(body: string, heading: string, preheader: string, hc: any, fc: any, senderName: string, senderEmail: string): string {
  hc = hc || { bgColor: "#1a1a2e", bgImageUrl: "", textColor: "#ffffff", showHeader: true, headerHeight: 180 };
  fc = fc || { bgColor: "#1a1a2e", textColor: "#ffffff", companyName: "Levoro Academy", contactEmail: "info@levoroacademy.com", socialLinks: [], showFooter: true };
  const headerHeight = hc.headerHeight || 180;
  const preheaderHtml = preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : "";
  const headerBgStyle = hc.bgImageUrl ? `background:url('${hc.bgImageUrl}') center/cover no-repeat;` : `background:${hc.bgColor};`;
  const headerHtml = hc.showHeader
    ? `<div style="${headerBgStyle}color:${hc.textColor};padding:32px 40px;text-align:center;min-height:${headerHeight}px;display:flex;align-items:center;justify-content:center;">
        ${heading ? `<h1 style="margin:0;font-size:22px;font-weight:700;color:${hc.textColor};">${heading}</h1>` : ""}
      </div>`
    : "";
  const socialIconCells = (fc.socialLinks || []).filter((s: any) => s.url).map((s: any) => {
    const iconUrl = getSocialIconImg(s.platform);
    if (!iconUrl) return "";
    return `<td style="padding:0 6px;"><a href="${s.url}" target="_blank" style="display:block;"><img src="${iconUrl}" width="24" height="24" alt="${s.platform}" style="display:block;border:0;" /></a></td>`;
  }).join("");
  const unsubscribeText = fc.unsubscribeText || "You received this email because you signed up on our website or made a purchase from us.";
  const unsubscribeUrl = fc.unsubscribeUrl || `mailto:${fc.contactEmail || "info@levoroacademy.com"}?subject=Unsubscribe`;
  const footerHtml = fc.showFooter
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${fc.bgColor};color:${fc.textColor};font-family:Arial,Helvetica,sans-serif;">
        <tr><td style="padding:28px 40px 16px;">
          ${fc.companyName ? `<div style="font-weight:600;font-size:14px;margin-bottom:6px;color:${fc.textColor};">${fc.companyName}</div>` : ""}
          ${fc.contactEmail ? `<div style="margin-bottom:12px;font-size:13px;"><a href="mailto:${fc.contactEmail}" style="color:${fc.textColor};text-decoration:none;">${fc.contactEmail}</a></div>` : ""}
          ${socialIconCells ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${socialIconCells}</tr></table>` : ""}
        </td></tr>
        <tr><td style="padding:12px 40px 28px;border-top:1px solid rgba(255,255,255,0.15);">
          <div style="color:${fc.textColor};opacity:0.8;font-size:12px;line-height:1.6;margin-bottom:10px;">${unsubscribeText}</div>
          <a href="${unsubscribeUrl}" style="color:${fc.textColor};text-decoration:underline;font-size:13px;font-weight:600;">Unsubscribe</a>
        </td></tr>
      </table>`
    : `<div style="padding:24px 40px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;">Sent by ${senderName} &lt;${senderEmail}&gt;</div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif}
    .container{max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
    .body-content{padding:32px 40px;color:#333;font-size:15px;line-height:1.6}
    .body-content img{max-width:100%}
  </style></head><body>
    ${preheaderHtml}
    <div class="container">${headerHtml}<div class="body-content">${body}</div>${footerHtml}</div>
  </body></html>`;
}

function replaceMergeTags(html: string, vars: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "gi"), value ?? "");
  }
  return result;
}

// Map auth event type → which email_settings template prefix to use
function pickTemplate(actionType: string): { prefix: "verify" | "reset" | "invite"; buttonLabel: string; defaultSubject: string } | null {
  switch (actionType) {
    case "signup":
    case "email_change_current":
    case "email_change_new":
    case "email_change":
      return { prefix: "verify", buttonLabel: "Confirm Email", defaultSubject: "Confirm your email" };
    case "recovery":
      return { prefix: "reset", buttonLabel: "Reset Your Password", defaultSubject: "Reset your password" };
    case "magiclink":
    case "invite":
      return { prefix: "invite", buttonLabel: "Set Up Your Account", defaultSubject: "You're invited" };
    default:
      return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!hookSecret) {
      return new Response(JSON.stringify({ error: "SEND_EMAIL_HOOK_SECRET not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify Standard Webhook signature from Supabase Auth
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    const wh = new Webhook(hookSecret.replace(/^v1,whsec_/, "").replace(/^whsec_/, ""));
    let event: any;
    try {
      event = wh.verify(payload, headers);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err?.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user, email_data } = event as {
      user: { email: string; id: string };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
        token_new?: string;
        token_hash_new?: string;
      };
    };

    const tmpl = pickTemplate(email_data.email_action_type);
    if (!tmpl) {
      // Unknown action type → noop (return 200 so Supabase doesn't retry, but no email sent)
      console.warn("Unhandled email_action_type:", email_data.email_action_type);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: emailSettings } = await adminClient
      .from("email_settings").select("*").limit(1).single();
    if (!emailSettings) {
      return new Response(JSON.stringify({ error: "Email settings not found" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await adminClient
      .from("profiles").select("first_name").eq("id", user.id).maybeSingle();
    const firstName = profile?.first_name || "there";

    // Build the verification/recovery action link manually
    // (Supabase passes token_hash + redirect_to so we construct the verify URL.)
    const verifyUrl = `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;

    const prefix = tmpl.prefix;
    const subjectTpl = emailSettings[`${prefix}_subject`] || tmpl.defaultSubject;
    const headingTpl = emailSettings[`${prefix}_heading`] || "";
    const preheaderTpl = emailSettings[`${prefix}_preheader`] || "";
    const bodyTpl = emailSettings[`${prefix}_body`] || `<p>Hi {{first_name}},</p><p>Please confirm using the button below.</p>`;
    const headerCfg = emailSettings[`${prefix}_header_config`];
    const footerCfg = emailSettings[`${prefix}_footer_config`];

    const mergeVars = {
      first_name: firstName,
      email: user.email,
      link: verifyUrl,
      token: email_data.token,
    };

    let bodyHtml = replaceMergeTags(bodyTpl, mergeVars);
    if (!bodyTpl.toLowerCase().includes("{{link}}")) {
      bodyHtml += `<div style="text-align:center;margin:24px 0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#1a1a2e;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">${tmpl.buttonLabel}</a>
      </div>`;
    }

    const subject = replaceMergeTags(subjectTpl, mergeVars);
    const heading = replaceMergeTags(headingTpl, mergeVars);
    const preheader = replaceMergeTags(preheaderTpl, mergeVars);

    const senderName = emailSettings.sender_name || "Levoro Academy";
    const senderEmailAddr = emailSettings.sender_email || "noreply@app.levoroacademy.com";

    const fullHtml = buildEmailHtml(bodyHtml, heading, preheader, headerCfg, footerCfg, senderName, senderEmailAddr);

    const resend = new Resend(resendApiKey);
    const { error: sendErr } = await resend.emails.send({
      from: `${senderName} <${senderEmailAddr}>`,
      to: [user.email],
      subject,
      html: fullHtml,
    });

    if (sendErr) {
      console.error("Resend send error:", sendErr);
      return new Response(JSON.stringify({ error: sendErr.message || "Send failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("auth-email-webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
