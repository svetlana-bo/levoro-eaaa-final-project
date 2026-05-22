import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, anonKey);

    let userId: string | null = null;

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (!claimsError && claimsData?.claims?.sub) {
      userId = claimsData.claims.sub;
    } else {
      const { data: userData, error: userError } = await authClient.auth.getUser(token);
      if (userError || !userData?.user?.id) {
        console.error("Auth verification failed", {
          claimsError: claimsError?.message ?? null,
          userError: userError?.message ?? null,
        });
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      userId = userData.user.id;
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Parse optional roles filter from body
    let rolesFilter: string[] | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.roles && Array.isArray(body.roles)) {
          rolesFilter = body.roles;
        }
      } catch {
        // no body or invalid JSON, proceed without filter
      }
    }

    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;

    let filteredUserIds: Set<string> | null = null;
    if (rolesFilter && rolesFilter.length > 0) {
      // Separate pseudo-roles (student_free, student_paying) from real roles
      const wantsFree = rolesFilter.includes("student_free");
      const wantsPaying = rolesFilter.includes("student_paying");
      const realRoles = rolesFilter.filter(
        (r) => r !== "student_free" && r !== "student_paying",
      );

      filteredUserIds = new Set<string>();

      if (realRoles.length > 0) {
        const { data: roleRows } = await adminClient
          .from("user_roles")
          .select("user_id, role")
          .in("role", realRoles);
        (roleRows || []).forEach((r: any) => filteredUserIds!.add(r.user_id));
      }

      if (wantsFree || wantsPaying) {
        // Get all student user IDs
        const { data: studentRows } = await adminClient
          .from("user_roles")
          .select("user_id")
          .eq("role", "student");
        const studentIds = (studentRows || []).map((r: any) => r.user_id);

        if (studentIds.length > 0) {
          // Fetch their subscription_status from profiles
          const { data: profileRows } = await adminClient
            .from("profiles")
            .select("id, subscription_status")
            .in("id", studentIds);
          const statusMap = new Map<string, string | null>();
          (profileRows || []).forEach((p: any) =>
            statusMap.set(p.id, p.subscription_status ?? null),
          );

          for (const uid of studentIds) {
            const isPaying = statusMap.get(uid) === "active";
            if (isPaying && wantsPaying) filteredUserIds.add(uid);
            if (!isPaying && wantsFree) filteredUserIds.add(uid);
          }
        }
      }
    }

    const emailMap: Record<string, string> = {};
    for (const u of users || []) {
      if (filteredUserIds && !filteredUserIds.has(u.id)) continue;
      emailMap[u.id] = u.email || "";
    }

    return new Response(JSON.stringify({ emailMap }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Edge function error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
