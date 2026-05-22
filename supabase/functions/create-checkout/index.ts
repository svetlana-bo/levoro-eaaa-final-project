import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICE_MAP: Record<string, string> = {
  monthly: "price_1TK3VWRspdzWwkhr03x71UdQ",
  quarterly: "price_1TK3WYRspdzWwkhrB2yK6V3g",
  yearly: "price_1TK3WuRspdzWwkhrmBzs4gYL",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { planId, trialDays } = await req.json();
    if (!planId || !PRICE_MAP[planId]) {
      throw new Error(`Invalid planId: ${planId}. Must be one of: ${Object.keys(PRICE_MAP).join(", ")}`);
    }
    const priceId = PRICE_MAP[planId];
    const trialPeriodDays = typeof trialDays === "number" && trialDays > 0 ? trialDays : undefined;
    logStep("Plan selected", { planId, priceId, trialPeriodDays });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://cozy-dash-portal.lovable.app";

    // Check if user is authenticated
    const authHeader = req.headers.get("Authorization");
    let customerId: string | undefined;
    let customerEmail: string | undefined;
    let isAuthenticated = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (!userError && userData.user?.email) {
        isAuthenticated = true;
        customerEmail = userData.user.email;
        logStep("User authenticated", { userId: userData.user.id, email: customerEmail });

        // Look up existing Stripe customer
        const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          logStep("Existing customer found", { customerId });
        }
      }
    }

    if (!isAuthenticated) {
      logStep("Guest checkout (no auth)");
    }

    const successUrl = isAuthenticated
      ? `${origin}/dashboard?success=true`
      : `${origin}/complete-account?session_id={CHECKOUT_SESSION_ID}`;

    const sessionParams: any = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      success_url: successUrl,
      cancel_url: `${origin}/memberships`,
    };

    if (isAuthenticated) {
      sessionParams.customer = customerId;
      sessionParams.customer_email = customerId ? undefined : customerEmail;
      if (customerId) {
        sessionParams.customer_update = { address: "auto", name: "auto" };
      }
    }

    if (trialPeriodDays) {
      sessionParams.subscription_data = { trial_period_days: trialPeriodDays };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, url: session.url, isAuthenticated });

    return new Response(JSON.stringify({ url: session.url }), {
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
