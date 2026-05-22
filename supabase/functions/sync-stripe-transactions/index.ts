import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stripe price ID → local plan tier (lowercase to match existing transactions.subscription_tier)
const PRICE_TO_TIER: Record<string, string> = {
  "price_1TK3VWRspdzWwkhr03x71UdQ": "monthly",
  "price_1TK3WYRspdzWwkhrB2yK6V3g": "quarterly",
  "price_1TK3WuRspdzWwkhrmBzs4gYL": "yearly",
};

const log = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-STRIPE-TRANSACTIONS] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const userId = userData.user?.id;
    if (!userId) throw new Error("User not authenticated");

    // Admin check
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
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

    // Paginate all paid invoices
    const allInvoices: Stripe.Invoice[] = [];
    let startingAfter: string | undefined = undefined;
    let pageCount = 0;
    while (true) {
      pageCount++;
      const page: Stripe.ApiList<Stripe.Invoice> = await stripe.invoices.list({
        status: "paid",
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.customer"],
      });
      allInvoices.push(...page.data);
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1].id;
      if (pageCount > 50) {
        log("Page cap reached, stopping pagination", { pageCount });
        break;
      }
    }
    log("Fetched paid invoices", { total: allInvoices.length });

    // Build email -> user_id map (single fetch via auth admin API)
    const emailToUserId = new Map<string, string>();
    let authPage = 1;
    while (true) {
      const { data: usersPage, error: usersErr } =
        await supabaseAdmin.auth.admin.listUsers({ page: authPage, perPage: 1000 });
      if (usersErr) throw new Error(`Failed to list users: ${usersErr.message}`);
      for (const u of usersPage.users) {
        if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
      }
      if (usersPage.users.length < 1000) break;
      authPage++;
      if (authPage > 20) break;
    }
    log("Built email map", { users: emailToUserId.size });

    let inserted = 0;
    let skipped = 0;
    let unmatched = 0;

    for (const invoice of allInvoices) {
      const customer = invoice.customer as Stripe.Customer | string | null;
      const email =
        typeof customer === "object" && customer && "email" in customer
          ? (customer as Stripe.Customer).email
          : null;

      if (!email) {
        unmatched++;
        continue;
      }

      const userId = emailToUserId.get(email.toLowerCase());
      if (!userId) {
        unmatched++;
        log("No matching user for invoice", { invoice: invoice.id, email });
        continue;
      }

      // Determine tier from first line item's price
      const line = invoice.lines?.data?.[0];
      const priceId = (line?.price as Stripe.Price | undefined)?.id ?? null;
      const tier = priceId ? PRICE_TO_TIER[priceId] ?? null : null;

      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : (invoice.subscription as any)?.id ?? null;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer as any)?.id ?? null;

      const amountPaid = (invoice.amount_paid ?? 0) / 100;
      const currencyCode = (invoice.currency || "eur").toUpperCase();
      const createdAt = invoice.created
        ? new Date(invoice.created * 1000).toISOString()
        : new Date().toISOString();

      // Tag €0 invoices as 'trial' so the UI can hide them from the regular financials tables
      const txType = (invoice.amount_paid ?? 0) === 0 ? "trial" : "subscription";

      // Idempotent upsert keyed by stripe_invoice_id
      const { error: upsertErr } = await supabaseAdmin
        .from("transactions")
        .upsert(
          {
            user_id: userId,
            type: txType,
            subscription_tier: tier,
            amount_paid: amountPaid,
            currency_code: currencyCode,
            amount_eur: currencyCode === "EUR" ? amountPaid : null,
            exchange_rate_eur: currencyCode === "EUR" ? 1 : null,
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            created_at: createdAt,
          },
          { onConflict: "stripe_invoice_id", ignoreDuplicates: false }
        );

      if (upsertErr) {
        log("Upsert error", { invoice: invoice.id, error: upsertErr.message });
        skipped++;
      } else {
        inserted++;
      }
    }

    log("Done", { inserted, skipped, unmatched, total: allInvoices.length });

    return new Response(
      JSON.stringify({ inserted, skipped, unmatched, total: allInvoices.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
