import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInboxUnreadCount(enabled: boolean = true) {
  return useQuery({
    queryKey: ["contact-unread-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("contact_threads" as any)
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("is_archived", false);
      if (error) return 0;
      return count || 0;
    },
    enabled,
    refetchInterval: 30000,
  });
}
