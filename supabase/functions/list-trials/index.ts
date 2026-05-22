import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_TO_PLAN: Record<string, string> = {
  "price_1TK3VWRspdzWwkhr03x71UdQ": "Monthly",
  "price_1TK3WYRspdzWwkhrB2yK6V3g": "Quarterly",
  "price_1TK3WuRspdzWwkhrmBzs4gYL": "Yearly",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[LIST-TRIALS] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Auth check via JWT claims (works with signing-keys system)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    let userId = claimsData?.claims?.sub as string | undefined;
    if (claimsError || !userId) {
      // Fallback to getUser when claims unavailable
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      userId = userData.user?.id;
    }
    if (!userId) throw new Error("User not authenticated");

    // Admin check
    const { data: isAdmin } = await supabaseClient.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Admin verified", { userId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Fetch all subscription statuses in parallel
    const [trialing, active, pastDue, canceled] = await Promise.all([
      stripe.subscriptions.list({ status: "trialing", limit: 100, expand: ["data.customer"] }),
      stripe.subscriptions.list({ status: "active", limit: 100, expand: ["data.customer"] }),
      stripe.subscriptions.list({ status: "past_due", limit: 100, expand: ["data.customer"] }),
      stripe.subscriptions.list({ status: "canceled", limit: 100, expand: ["data.customer"] }),
    ]);

    const allSubs = [...trialing.data, ...active.data, ...pastDue.data, ...canceled.data];
    logStep("Fetched subscriptions", { total: allSubs.length });

    const subscriptions = allSubs.map((sub) => {
      const customer = sub.customer as Stripe.Customer;
      const item = sub.items.data[0];
      const priceId = item?.price?.id;

      // With API version 2025-08-27.basil, period dates are on the item
      const periodStart = item?.current_period_start ?? sub.current_period_start;
      const periodEnd = item?.current_period_end ?? sub.current_period_end;

      return {
        id: sub.id,
        customer_name: customer.name || null,
        customer_email: customer.email || null,
        plan: priceId ? (PRICE_TO_PLAN[priceId] || "Unknown") : "Unknown",
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        created: sub.created ? new Date(sub.created * 1000).toISOString() : null,
      };
    });

    return new Response(JSON.stringify({ trials: subscriptions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
