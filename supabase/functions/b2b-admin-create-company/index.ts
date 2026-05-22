import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.45.0/cors";
import { z } from "npm:zod@3.23.8";

const PLACEHOLDER_ACTOR = "71d59645-b050-4f28-bd81-892a4fd4ee0f";

const BodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  domain: z.string().trim().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Invalid domain"),
  primary_contact_email: z.string().trim().email().max(255),
  tier: z.enum(["tier_1", "tier_2", "tier_3"]),
  seat_count: z.number().int().min(1).max(100000),
  license_expires_at: z.string().min(1),
  notes: z.string().max(2000).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const body = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve actor: use JWT user id if present, else placeholder.
    let actor = PLACEHOLDER_ACTOR;
    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
      if (data?.user?.id) actor = data.user.id;
    }

    const { data: company, error: cErr } = await supabase
      .schema("b2b")
      .from("companies")
      .insert({
        name: body.name,
        domain: body.domain,
        primary_contact_email: body.primary_contact_email,
        tier: body.tier,
        seat_count: body.seat_count,
        seats_used: 0,
        license_status: "active",
        license_expires_at: body.license_expires_at,
        billing_status: "current",
        notes: body.notes ?? null,
      })
      .select("id, name")
      .single();

    if (cErr || !company) {
      return new Response(JSON.stringify({ error: cErr?.message ?? "insert failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.schema("b2b").from("audit_logs").insert({
      actor_user_id: actor,
      company_id: company.id,
      action: "company_created",
      target_type: "company",
    });

    return new Response(JSON.stringify({ id: company.id, name: company.name }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
