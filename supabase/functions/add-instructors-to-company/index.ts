import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

function buildEmailHtml(body: string, heading: string, preheader: string, headerConfig: any, footerConfig: any, senderName: string, senderEmail: string): string {
  const hc = headerConfig || { bgColor: "#1a1a2e", bgImageUrl: "", textColor: "#ffffff", showHeader: true, headerHeight: 180 };
  const fc = footerConfig || { bgColor: "#1a1a2e", textColor: "#ffffff", companyName: "Levoro Academy", contactEmail: "info@levoroacademy.com", socialLinks: [], showFooter: true };
  const headerHeight = hc.headerHeight || 180;
  const preheaderHtml = preheader
    ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>`
    : "";
  const headerBgStyle = hc.bgImageUrl
    ? `background:url('${hc.bgImageUrl}') center/cover no-repeat;`
    : `background:${hc.bgColor};`;
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
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="vertical-align:top;">
            ${fc.companyName ? `<div style="font-weight:600;font-size:14px;margin-bottom:6px;color:${fc.textColor};">${fc.companyName}</div>` : ""}
            ${fc.contactEmail ? `<div style="margin-bottom:12px;font-size:13px;"><a href="mailto:${fc.contactEmail}" style="color:${fc.textColor};text-decoration:none;">${fc.contactEmail}</a></div>` : ""}
            ${socialIconCells ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${socialIconCells}</tr></table>` : ""}
          </td></tr></table>
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
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "gi"), value);
  }
  return result;
}

type InstructorInput = {
  first_name: string;
  last_name: string;
  email: string;
  country: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) {
      const { data: isWebadmin } = await adminClient.rpc("has_role", { _user_id: caller.id, _role: "webadmin" });
      if (!isWebadmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const {
      company_id,
      instructors,
      send_invite = true,
      redirect_url,
    }: {
      company_id: string;
      instructors: InstructorInput[];
      send_invite?: boolean;
      redirect_url?: string;
    } = await req.json();

    if (!company_id || typeof company_id !== "string") {
      return new Response(JSON.stringify({ error: "company_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(instructors) || instructors.length === 0) {
      return new Response(JSON.stringify({ error: "At least one instructor is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const i of instructors) {
      if (!i.email || !i.first_name || !i.last_name || !i.country) {
        return new Response(JSON.stringify({ error: "Every instructor needs first name, last name, email, and country" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    const emails = instructors.map(i => i.email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) {
      return new Response(JSON.stringify({ error: "Duplicate instructor emails in form" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: company, error: companyErr } = await adminClient
      .from("instructor_companies")
      .select("id, name")
      .eq("id", company_id)
      .single();
    if (companyErr || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetOrigin = redirect_url || "https://cozy-dash-portal.lovable.app";
    const resend = (send_invite && resendApiKey) ? new Resend(resendApiKey) : null;
    let emailSettings: any = null;
    if (resend) {
      const { data } = await adminClient.from("email_settings").select("*").limit(1).single();
      emailSettings = data;
    }

    const results: { email: string; success: boolean; userId?: string; error?: string }[] = [];

    for (const ins of instructors) {
      const email = ins.email.trim();
      try {
        const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            first_name: ins.first_name,
            last_name: ins.last_name,
            instructor_type: "company_member",
          },
        });
        if (createErr || !newUser?.user) throw new Error(createErr?.message || "Failed to create user");

        const userId = newUser.user.id;

        for (let attempt = 0; attempt < 5; attempt++) {
          const { data, error } = await adminClient
            .from("profiles")
            .update({
              first_name: ins.first_name,
              last_name: ins.last_name,
              country: ins.country,
              instructor_type: "company_member",
              invite_sent: send_invite,
            })
            .eq("id", userId)
            .select("id");
          if (!error && data && data.length > 0) break;
          if (attempt < 4) await new Promise(r => setTimeout(r, 500));
        }

        await adminClient.from("user_roles").update({ role: "instructor" }).eq("user_id", userId);

        const { error: memberErr } = await adminClient
          .from("instructor_company_members")
          .insert({ user_id: userId, company_id: company.id, member_role: "instructor" });
        if (memberErr) throw new Error(`Member link failed: ${memberErr.message}`);

        if (resend && emailSettings) {
          try {
            const redirectTo = `${targetOrigin}/reset-password`;
            const { data: linkData } = await adminClient.auth.admin.generateLink({
              type: "magiclink", email, options: { redirectTo },
            });
            const actionLink = linkData?.properties?.action_link || "";
            const mergeVars = { first_name: ins.first_name || "there", email, link: actionLink };
            let bodyHtml = replaceMergeTags(emailSettings.invite_body, mergeVars);
            if (!emailSettings.invite_body.toLowerCase().includes("{{link}}")) {
              bodyHtml += `<div style="text-align:center;margin:24px 0;"><a href="${actionLink}" style="display:inline-block;padding:12px 32px;background:#1a1a2e;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">Set Up Your Account</a></div>`;
            }
            const heading = replaceMergeTags(emailSettings.invite_heading || "", mergeVars);
            const subject = replaceMergeTags(emailSettings.invite_subject || "You're Invited!", mergeVars);
            const preheader = replaceMergeTags(emailSettings.invite_preheader || "", mergeVars);
            const senderName = emailSettings.sender_name || "Levoro Academy";
            const senderEmailAddr = emailSettings.sender_email || "noreply@app.levoroacademy.com";
            const fullHtml = buildEmailHtml(bodyHtml, heading, preheader, emailSettings.invite_header_config, emailSettings.invite_footer_config, senderName, senderEmailAddr);
            await resend.emails.send({
              from: `${senderName} <${senderEmailAddr}>`,
              to: [email], subject, html: fullHtml,
            });
          } catch (mailErr: any) {
            console.error("Invite email failed for", email, mailErr?.message);
          }
        }

        results.push({ email, success: true, userId });
      } catch (err: any) {
        results.push({ email, success: false, error: err?.message || "Unknown error" });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
