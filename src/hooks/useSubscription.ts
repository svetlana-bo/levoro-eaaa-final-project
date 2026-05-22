import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionStatus {
  subscribed: boolean;
  planId: string | null;
  subscriptionEnd: string | null;
  status: string | null;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ["subscription-status", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      return data as SubscriptionStatus;
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  return {
    subscribed: data?.subscribed ?? false,
    planId: data?.planId ?? null,
    subscriptionEnd: data?.subscriptionEnd ?? null,
    status: data?.status ?? null,
    cancelAtPeriodEnd: data?.cancelAtPeriodEnd ?? false,
    isLoading,
    refetch,
  };
}
