import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminCompany = {
  id: string;
  name: string;
  domain: string | null;
  primary_contact_email: string | null;
  notes: string | null;
  tier: "tier_1" | "tier_2" | "tier_3";
  seat_count: number;
  seats_used: number;
  license_status: "active" | "suspended" | "expired" | "cancelled";
  license_expires_at: string | null;
  billing_status: string;
  created_at: string;
};

export function useAdminCompanies() {
  return useQuery({
    queryKey: ["admin", "companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_b2b_companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminCompany[];
    },
  });
}

export function useAdminCompany(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["admin", "company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_b2b_companies")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as AdminCompany | null;
    },
  });
}

export function useCompanyAuditFeed(companyId: string | undefined, limit = 5) {
  return useQuery({
    enabled: !!companyId,
    queryKey: ["admin", "company-audit", companyId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_b2b_audit_feed")
        .select("*")
        .eq("company_id", companyId!)
        .order("occurred_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}
