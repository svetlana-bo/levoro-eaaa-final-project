import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrgMember = {
  user_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  department: string | null;
  status: string | null;
  role: string | null;
  last_active_at: string | null;
  created_at: string | null;
};

export function useOrgUsers(companyId: string | null) {
  return useQuery({
    enabled: !!companyId,
    queryKey: ["b2b", "members", companyId],
    queryFn: async (): Promise<OrgMember[]> => {
      const { data, error } = await supabase
        .from("v_b2b_members")
        .select("*")
        .eq("company_id", companyId!)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as OrgMember[];
    },
  });
}
