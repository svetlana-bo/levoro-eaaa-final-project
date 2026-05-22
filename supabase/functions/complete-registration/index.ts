import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[COMPLETE-REGISTRATION] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id, first_name, last_name, country, password, marketing_opt_in } = await req.json();

    if (!session_id) throw new Error("session_id is required");
    if (!first_name || !first_name.trim()) throw new Error("first_name is required");
    if (!last_name || !last_name.trim()) throw new Error("last_name is required");
    if (!country || !country.trim()) throw new Error("country is required");
    if (!password || password.length < 6) throw new Error("password must be at least 6 characters");

    logStep("Input validated", { session_id, first_name, last_name, country, marketing_opt_in: !!marketing_opt_in });

    // Retrieve checkout session from Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session.customer_details?.email) {
      throw new Error("Could not retrieve email from Stripe session");
    }
    const email = session.customer_details.email;
    logStep("Stripe session retrieved", { email, stripeCustomerId: session.customer });

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    if (existingUser) {
      throw new Error("An account with this email already exists. Please log in instead.");
    }

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        consent_method: "checkout_implicit",
        consent_country: country,
      },
    });

    if (createError) throw new Error(`Failed to create user: ${createError.message}`);
    logStep("User created", { userId: newUser.user.id });

    // Update profile with country
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ country: country, first_name: first_name.trim(), last_name: last_name.trim() })
      .eq("id", newUser.user.id);

    if (profileError) {
      logStep("Profile update warning", { error: profileError.message });
    }

    // Record marketing email preference. Always upsert a row so the
    // unsubscribe filter in send-marketing-email correctly honors the choice
    // (is_active=true if opted in, false if not).
    const normalizedEmail = email.toLowerCase().trim();
    const optedIn = marketing_opt_in === true;
    const { error: subscriberError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert(
        {
          email: normalizedEmail,
          name: `${first_name.trim()} ${last_name.trim()}`.trim(),
          is_active: optedIn,
          unsubscribed_at: optedIn ? null : new Date().toISOString(),
          unsubscribe_source: optedIn ? null : "signup_default",
        },
        { onConflict: "email" }
      );
    if (subscriberError) {
      logStep("Newsletter subscriber upsert warning", { error: subscriberError.message });
    } else {
      logStep("Newsletter preference recorded", { optedIn });
    }

    // Update Stripe customer metadata with user ID
    if (session.customer) {
      try {
        await stripe.customers.update(session.customer as string, {
          metadata: { supabase_user_id: newUser.user.id },
          name: `${first_name.trim()} ${last_name.trim()}`,
        });
        logStep("Stripe customer updated with user ID");
      } catch (e) {
        logStep("Stripe customer update warning", { error: String(e) });
      }
    }

    return new Response(JSON.stringify({ success: true, email }), {
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
