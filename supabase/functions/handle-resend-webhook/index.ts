import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Webhook } from "https://esm.sh/svix@1.24.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getWebhookEventMeta(mappedEventType: string, data: any) {
  const openMeta = data?.open && typeof data.open === "object" ? data.open : {};
  const clickMeta = data?.click && typeof data.click === "object" ? data.click : {};
  const eventMeta = mappedEventType === "opened"
    ? openMeta
    : mappedEventType === "clicked"
      ? clickMeta
      : {};

  return {
    ua: String(eventMeta.userAgent || data?.user_agent || "").trim().toLowerCase(),
    ip: String(eventMeta.ipAddress || data?.ip_address || "").trim(),
    eventTimestamp: String(eventMeta.timestamp || data?.created_at || "").trim(),
  };
}

function getOpenFilterReason(params: {
  ua: string;
  ip: string;
  sendAgeMs: number | null;
}) {
  const { ua, ip, sendAgeMs } = params;

  if (!ua) return "empty_ua_filtered";

  const isLegacyGooglePrefetchUa = /chrome\/42\.0\.2311\.135.*edge\/12\.246.*mozilla\/5\.0/i.test(ua);
  const isGoogleImageProxy = /(googleimageproxy|gmailimageproxy|ggpht\.com)/i.test(ua);
  const isSecurityBot = /(google-safety|outlook|microsoft office|safelinks|barracuda|mimecast|proofpoint|mailgun|seznam|yandex|urlscan|crawler|spider|bot|fetch|prefetch|preview|scanner|security|antivirus|fortinet|fireeye|bitdefender)/i.test(ua);
  const isImmediateGoogleProxyFetch = /^(66\.102\.|74\.125\.)/.test(ip) && sendAgeMs !== null && sendAgeMs < 10000;

  if (isLegacyGooglePrefetchUa) return "legacy_google_prefetch_filtered";
  if (isSecurityBot) return "security_bot_filtered";
  if (isGoogleImageProxy && sendAgeMs !== null && sendAgeMs < 10000) return "gmail_proxy_prefetch_filtered";
  if (isImmediateGoogleProxyFetch && !isGoogleImageProxy) return "google_ip_prefetch_filtered";

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();

    // Verify Svix signature if secret is configured
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    if (webhookSecret) {
      const svixId = req.headers.get("svix-id");
      const svixTimestamp = req.headers.get("svix-timestamp");
      const svixSignature = req.headers.get("svix-signature");

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error("Missing Svix headers");
        return new Response(JSON.stringify({ error: "Missing signature headers" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        const wh = new Webhook(webhookSecret);
        wh.verify(rawBody, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
        console.log("Webhook signature verified");
      } catch (verifyErr: any) {
        console.error("Webhook signature verification failed:", verifyErr.message);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("RESEND_WEBHOOK_SECRET not set — skipping signature verification");
    }

    const body = JSON.parse(rawBody);
    console.log("Resend webhook event:", JSON.stringify(body));

    const eventType = body.type;
    const data = body.data;

    if (!data || !eventType) {
      return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendMessageId = data.email_id;
    const recipientEmail = Array.isArray(data.to) ? data.to[0] : data.to;

    if (!resendMessageId) {
      return new Response(JSON.stringify({ ok: true, skipped: "no email_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let mappedEventType: string | null = null;
    if (eventType === "email.opened") mappedEventType = "opened";
    else if (eventType === "email.clicked") mappedEventType = "clicked";
    else if (eventType === "email.delivered") mappedEventType = "delivered";
    else if (eventType === "email.bounced") mappedEventType = "bounced";

    if (!mappedEventType) {
      return new Response(JSON.stringify({ ok: true, skipped: "unhandled event type" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up the original send record by resend_message_id
    const { data: sendRecord } = await supabase
      .from("marketing_email_sends")
      .select("*")
      .eq("resend_message_id", resendMessageId)
      .limit(1)
      .maybeSingle();

    // Enhanced bot/proxy filtering for opens and clicks
    if (mappedEventType === "opened" || mappedEventType === "clicked") {
      const { ua, ip, eventTimestamp } = getWebhookEventMeta(mappedEventType, data);
      const eventTimeMs = eventTimestamp ? new Date(eventTimestamp).getTime() : Date.now();
      const sendAgeMs = sendRecord?.created_at
        ? Math.max(0, eventTimeMs - new Date(sendRecord.created_at).getTime())
        : null;

      if (mappedEventType === "opened") {
        const openFilterReason = getOpenFilterReason({ ua, ip, sendAgeMs });
        const isDelayedGmailProxyOpen = /(googleimageproxy|gmailimageproxy|ggpht\.com)/i.test(ua)
          && sendAgeMs !== null
          && sendAgeMs >= 10000;

        if (isDelayedGmailProxyOpen) {
          console.log(`Allowing delayed Gmail proxy open for ${resendMessageId} (${Math.round(sendAgeMs / 1000)}s after send)`);
        } else if (openFilterReason) {
          console.log(`Ignoring automated open (${openFilterReason}) for ${resendMessageId} (ua: ${ua.slice(0, 80)}, ip: ${ip || "n/a"})`);
          return new Response(JSON.stringify({ ok: true, skipped: openFilterReason, user_agent: ua.slice(0, 80), ip }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Idempotency: skip if this event type was already recorded
    if (sendRecord) {
      if (mappedEventType === "opened" && sendRecord.is_opened) {
        console.log(`Skipping duplicate open for send ${sendRecord.id}`);
        return new Response(JSON.stringify({ ok: true, skipped: "already_opened" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (mappedEventType === "clicked" && sendRecord.is_clicked) {
        console.log(`Skipping duplicate click for send ${sendRecord.id}`);
        return new Response(JSON.stringify({ ok: true, skipped: "already_clicked" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Timing heuristic: opens within 2 seconds of send are almost always automated
      if (mappedEventType === "opened" && sendRecord.created_at) {
        const sendTime = new Date(sendRecord.created_at).getTime();
        const now = Date.now();
        if (now - sendTime < 2000) {
          console.log(`Ignoring open within 2s of send for ${sendRecord.id} (likely automated)`);
          return new Response(JSON.stringify({ ok: true, skipped: "timing_filtered" }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Extract tags from webhook data if available
    const tags = data.tags || {};
    const sendId = tags.send_id || null;
    const flowId = tags.flow_id || sendRecord?.flow_id || null;
    const nodeId = tags.node_id || sendRecord?.flow_node_id || null;

    // Get template info from send record
    const templateName = sendRecord?.template_name || "";
    const templateId = sendRecord?.template_id || null;

    // Update the send record with open/click status (first occurrence only)
    if (sendRecord) {
      const updates: Record<string, any> = {};
      if (mappedEventType === "opened") {
        updates.is_opened = true;
        updates.opened_at = new Date().toISOString();
        updates.status = "opened";
      }
      if (mappedEventType === "clicked") {
        updates.is_clicked = true;
        updates.clicked_at = new Date().toISOString();
        updates.status = "clicked";
        updates.click_url = data.click?.link || data.click?.url || null;
        // Also mark as opened if not yet (a click implies an open)
        if (!sendRecord.is_opened) {
          updates.is_opened = true;
          updates.opened_at = new Date().toISOString();
        }
      }
      if (mappedEventType === "bounced") {
        updates.status = "bounced";
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("marketing_email_sends")
          .update(updates)
          .eq("id", sendRecord.id);
        if (updateError) {
          console.error("Failed to update send record:", updateError);
        } else {
          console.log(`Updated send record ${sendRecord.id} with ${mappedEventType}`);
        }
      }
    } else {
      console.warn(`No send record found for resend_message_id: ${resendMessageId}`);
    }

    // Insert email event only for genuine new state transitions
    const { error } = await supabase.from("email_events").insert({
      event_type: mappedEventType,
      email_type: "marketing",
      recipient_email: recipientEmail || "",
      template_name: templateName,
      template_id: templateId,
      metadata: {
        resend_message_id: resendMessageId,
        email_id: resendMessageId,
        send_id: sendId,
        flow_id: flowId,
        node_id: nodeId,
        raw_event: eventType,
        click_url: data.click?.link || data.click?.url || null,
        timestamp: data.created_at || new Date().toISOString(),
      },
    } as any);

    if (error) {
      console.error("Failed to insert email event:", error);
    }

    return new Response(JSON.stringify({ ok: true, event: mappedEventType, matched_send: !!sendRecord }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Webhook error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
