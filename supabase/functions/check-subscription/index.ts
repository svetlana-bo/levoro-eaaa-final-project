import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Reverse map: Stripe price ID → local plan ID
const PRICE_TO_PLAN: Record<string, string> = {
  "price_1TK3VWRspdzWwkhr03x71UdQ": "monthly",
  "price_1TK3WYRspdzWwkhrB2yK6V3g": "quarterly",
  "price_1TK3WuRspdzWwkhrmBzs4gYL": "yearly",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${d}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check trialing
    let sub = subscriptions.data[0];
    if (!sub) {
      const trialing = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      sub = trialing.data[0];
    }

    if (!sub) {
      logStep("No active/trialing subscription found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const item = sub.items.data[0];
    const priceId = item?.price?.id;
    const planId = priceId ? (PRICE_TO_PLAN[priceId] || null) : null;

    // With API version 2025-08-27.basil, period dates are on the item, not the subscription
    const periodEnd = item?.current_period_end ?? sub.current_period_end;
    const subscriptionEnd = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null;

    logStep("Active subscription found", {
      subscriptionId: sub.id,
      planId,
      status: sub.status,
      subscriptionEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });

    return new Response(JSON.stringify({
      subscribed: true,
      planId,
      subscriptionEnd,
      status: sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    }), {
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
