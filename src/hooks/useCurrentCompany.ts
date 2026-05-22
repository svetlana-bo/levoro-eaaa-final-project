import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentCompanyId } from "@/lib/b2bContext";
import { subscribeViewAs } from "@/lib/viewAsContext";

export function useCurrentCompany() {
  const [companyId, setCompanyId] = useState<string>(() => getCurrentCompanyId());

  useEffect(() => subscribeViewAs(() => setCompanyId(getCurrentCompanyId())), []);

  const query = useQuery({
    queryKey: ["b2b", "company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_b2b_companies")
        .select("*")
        .eq("id", companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  return { companyId, company: query.data, isLoading: query.isLoading };
}
