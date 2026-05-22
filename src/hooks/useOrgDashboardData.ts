import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOrgDashboardData(companyId: string | null) {
  return useQuery({
    enabled: !!companyId,
    queryKey: ["b2b", "dashboard", companyId],
    queryFn: async () => {
      const cid = companyId!;
      const [
        activeRes,
        pendingRes,
        atRiskRes,
        invitesStaleRes,
        overdueRes,
        feedRes,
      ] = await Promise.all([
        supabase.from("v_b2b_members").select("user_id", { count: "exact", head: true })
          .eq("company_id", cid).eq("status", "active"),
        supabase.from("v_b2b_members").select("user_id", { count: "exact", head: true })
          .eq("company_id", cid).eq("status", "invited"),
        supabase.from("v_b2b_enrolments").select("id", { count: "exact", head: true })
          .eq("company_id", cid).eq("status", "overdue"),
        supabase.from("v_b2b_members").select("user_id", { count: "exact", head: true })
          .eq("company_id", cid).eq("status", "invited")
          .lt("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from("v_b2b_enrolments").select("user_id", { count: "exact", head: true })
          .eq("company_id", cid).eq("status", "overdue"),
        supabase.from("v_b2b_audit_feed").select("*")
          .eq("company_id", cid).order("occurred_at", { ascending: false }).limit(5),
      ]);

      return {
        activeLearners: activeRes.count ?? 0,
        pendingInvites: pendingRes.count ?? 0,
        atRisk: atRiskRes.count ?? 0,
        invitesStale: invitesStaleRes.count ?? 0,
        overdueLearners: overdueRes.count ?? 0,
        feed: feedRes.data ?? [],
      };
    },
  });
}
