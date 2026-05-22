import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MANAGE-PROMO-CODES] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Verify admin
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "webadmin"])
      .limit(1);
    if (!roleData || roleData.length === 0) throw new Error("Admin access required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const { action, ...params } = await req.json();
    logStep("Action", { action });

    if (action === "list") {
      const coupons = await stripe.coupons.list({ limit: 50 });
      // For each coupon, get promotion codes
      const result = [];
      for (const coupon of coupons.data) {
        const promoCodes = await stripe.promotionCodes.list({ coupon: coupon.id, limit: 10 });
        result.push({
          ...coupon,
          promotion_codes: promoCodes.data.map(pc => ({ id: pc.id, code: pc.code, active: pc.active })),
        });
      }
      return new Response(JSON.stringify({ coupons: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { name, percent_off, amount_off, duration, duration_in_months, code } = params;
      if (!name) throw new Error("name is required");

      const couponParams: any = { name, duration: duration || "once" };
      if (percent_off) couponParams.percent_off = percent_off;
      else if (amount_off) { couponParams.amount_off = Math.round(amount_off * 100); couponParams.currency = "eur"; }
      else throw new Error("Either percent_off or amount_off is required");
      if (duration === "repeating" && duration_in_months) couponParams.duration_in_months = duration_in_months;

      const coupon = await stripe.coupons.create(couponParams);
      logStep("Coupon created", { couponId: coupon.id });

      // Create a promotion code for this coupon
      const promoCode = code || name.toUpperCase().replace(/\s+/g, "");
      const promo = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: promoCode,
      });
      logStep("Promotion code created", { code: promo.code });

      return new Response(JSON.stringify({ coupon, promotion_code: promo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { coupon_id } = params;
      if (!coupon_id) throw new Error("coupon_id is required");
      await stripe.coupons.del(coupon_id);
      logStep("Coupon deleted", { coupon_id });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
