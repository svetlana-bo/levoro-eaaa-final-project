import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1TK3VWRspdzWwkhr03x71UdQ": "Monthly",
  "price_1TK3WYRspdzWwkhrB2yK6V3g": "Quarterly",
  "price_1TK3WuRspdzWwkhrmBzs4gYL": "Yearly",
};

const log = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[LIST-TRIAL-SUBS] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Auth via JWT claims (signing-keys compatible) with getUser fallback
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    let userId = claimsData?.claims?.sub as string | undefined;
    if (claimsError || !userId) {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      userId = userData.user?.id;
    }
    if (!userId) throw new Error("User not authenticated");

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }
    log("Admin verified", { userId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch every subscription that ever had a trial across all relevant statuses
    const [trialing, active, pastDue, canceled] = await Promise.all([
      stripe.subscriptions.list({ status: "trialing", limit: 100, expand: ["data.customer"] }),
      stripe.subscriptions.list({ status: "active", limit: 100, expand: ["data.customer"] }),
      stripe.subscriptions.list({ status: "past_due", limit: 100, expand: ["data.customer"] }),
      stripe.subscriptions.list({ status: "canceled", limit: 100, expand: ["data.customer"] }),
    ]);

    const allSubs = [...trialing.data, ...active.data, ...pastDue.data, ...canceled.data]
      .filter((s) => !!s.trial_start);
    log("Subscriptions with trials", { total: allSubs.length });

    const now = Math.floor(Date.now() / 1000);

    const trials = await Promise.all(allSubs.map(async (sub) => {
      const customer = sub.customer as Stripe.Customer;
      const item = sub.items.data[0];
      const priceId = item?.price?.id;
      const plan = priceId ? (PRICE_TO_PLAN[priceId] || "Unknown") : "Unknown";

      const trialStart = sub.trial_start ?? null;
      const trialEnd = sub.trial_end ?? null;
      const trialDays = trialStart && trialEnd
        ? Math.max(1, Math.round((trialEnd - trialStart) / 86400))
        : null;

      // Compute status
      let status: "Active" | "Converted" | "Canceled" | "Expired" = "Active";
      if (sub.status === "trialing" && trialEnd && trialEnd > now) {
        status = "Active";
      } else if ((sub.status === "active" || sub.status === "past_due") && trialEnd && trialEnd <= now) {
        status = "Converted";
      } else if (sub.status === "canceled") {
        const canceledAt = sub.canceled_at ?? sub.ended_at ?? null;
        if (canceledAt && trialEnd && canceledAt <= trialEnd) {
          status = "Canceled";
        } else {
          status = "Expired";
        }
      } else if (sub.status === "active" && (!trialEnd || trialEnd > now)) {
        status = "Active";
      }

      // Find first paid invoice on this subscription (amount_paid > 0)
      let convertedAt: string | null = null;
      let convertedAmount: number | null = null;
      let convertedCurrency: string | null = null;

      if (status === "Converted" || status === "Expired") {
        try {
          const invoices = await stripe.invoices.list({
            subscription: sub.id,
            status: "paid",
            limit: 100,
          });
          const paid = invoices.data
            .filter((inv) => (inv.amount_paid ?? 0) > 0)
            .sort((a, b) => (a.created ?? 0) - (b.created ?? 0));
          const first = paid[0];
          if (first) {
            convertedAt = first.created ? new Date(first.created * 1000).toISOString() : null;
            convertedAmount = (first.amount_paid ?? 0) / 100;
            convertedCurrency = (first.currency || "eur").toUpperCase();
          }
        } catch (e) {
          log("Failed to fetch invoices for sub", { sub: sub.id, error: String(e) });
        }
      }

      return {
        id: sub.id,
        customer_name: customer?.name || null,
        customer_email: customer?.email || null,
        plan,
        trial_start: trialStart ? new Date(trialStart * 1000).toISOString() : null,
        trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
        trial_days: trialDays,
        status,
        converted_at: convertedAt,
        converted_amount: convertedAmount,
        converted_currency: convertedCurrency,
        sub_status: sub.status,
      };
    }));

    // Newest trial first
    trials.sort((a, b) => {
      const at = a.trial_start ? new Date(a.trial_start).getTime() : 0;
      const bt = b.trial_start ? new Date(b.trial_start).getTime() : 0;
      return bt - at;
    });

    return new Response(JSON.stringify({ trials }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
