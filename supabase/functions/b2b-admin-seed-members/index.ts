import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.45.0/cors";

// Idempotent: for each seeded company, ensure a small mix of members exists
// (active / invited) so Stage 2 surfaces have content during view-as.

type SeedCompany = {
  name: string;
  members: { first: string; last: string; dept: string; status: "active" | "invited"; days_ago: number }[];
};

const SEEDS: SeedCompany[] = [
  {
    name: "Nordic Hospitality Group",
    members: [
      { first: "Anna", last: "Berg", dept: "Operations", status: "active", days_ago: 1 },
      { first: "Erik", last: "Lund", dept: "Front of House", status: "active", days_ago: 3 },
      { first: "Maja", last: "Holm", dept: "Kitchen", status: "active", days_ago: 7 },
      { first: "Johan", last: "Sten", dept: "Front of House", status: "invited", days_ago: 0 },
      { first: "Sara", last: "Vik", dept: "Operations", status: "invited", days_ago: 0 },
      { first: "Oskar", last: "Dahl", dept: "Kitchen", status: "active", days_ago: 45 },
      { first: "Linnea", last: "Ek", dept: "Front of House", status: "active", days_ago: 62 },
    ],
  },
  {
    name: "Riverside Consulting",
    members: [
      { first: "Mark", last: "Schmidt", dept: "Leadership", status: "active", days_ago: 2 },
      { first: "Petra", last: "Klein", dept: "Strategy", status: "active", days_ago: 9 },
      { first: "Tomas", last: "Weiss", dept: "Strategy", status: "invited", days_ago: 0 },
      { first: "Hanna", last: "Roth", dept: "Operations", status: "active", days_ago: 38 },
      { first: "Felix", last: "Braun", dept: "Operations", status: "active", days_ago: 80 },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const created: Record<string, number> = {};

  for (const seed of SEEDS) {
    const { data: company } = await supabase
      .schema("b2b")
      .from("companies")
      .select("id, domain")
      .eq("name", seed.name)
      .maybeSingle();

    if (!company) continue;

    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", company.id);

    if ((count ?? 0) > 0) {
      created[seed.name] = 0;
      continue;
    }

    let added = 0;
    for (const m of seed.members) {
      const email = `${m.first.toLowerCase()}.${m.last.toLowerCase()}@${company.domain}`;

      const { data: userRes, error: uErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        password: crypto.randomUUID(),
        user_metadata: { first_name: m.first, last_name: m.last },
      });
      if (uErr || !userRes?.user) continue;
      const uid = userRes.user.id;

      const lastLogin = new Date(Date.now() - m.days_ago * 86400_000).toISOString();
      await supabase.from("profiles").update({
        first_name: m.first,
        last_name: m.last,
        company_id: company.id,
        department: m.dept,
        status: m.status,
        last_login: lastLogin,
      }).eq("id", uid);

      await supabase.from("user_roles").upsert({
        user_id: uid,
        role: "company_student",
      }, { onConflict: "user_id,role" });

      added++;
    }

    created[seed.name] = added;
  }

  return new Response(JSON.stringify({ ok: true, created }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
