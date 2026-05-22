import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MembershipPlan {
  id: string;
  title: string;
  price_eur: number;
  original_price_eur: number;
  billing_period: string;
  months: number;
  features: string[];
  sort_order: number;
  is_featured: boolean;
  badge: string | null;
  discount_ends_at: string | null;
  trial_days: number;
}

export function useMembershipPlans() {
  return useQuery({
    queryKey: ["membership-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_plans" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      // Check for expired discounts - return effective price
      return (data as any[]).map((plan): MembershipPlan => {
        const discountExpired = plan.discount_ends_at && new Date(plan.discount_ends_at) < new Date();
        return {
          ...plan,
          price_eur: discountExpired ? plan.original_price_eur : plan.price_eur,
        };
      });
    },
  });
}

export function getEffectivePrice(plan: MembershipPlan): number {
  return plan.price_eur;
}

export function getTotalPrice(plan: MembershipPlan): number {
  return plan.price_eur * plan.months;
}

export function getBillingLabel(
  plan: MembershipPlan,
  formatPrice?: (eur: number, planId?: string) => string,
  getPrice?: (eur: number, planId?: string) => number
): string {
  const fmt = formatPrice || ((v: number) => `€${v.toFixed(2)}`);
  if (plan.billing_period === "yearly" || plan.billing_period === "quarterly") {
    const total = getPrice
      ? getPrice(plan.price_eur, plan.id) * plan.months
      : plan.price_eur * plan.months;
    const label = plan.billing_period === "yearly" ? "annually" : "quarterly";
    return `Billed ${label} (${fmt(total)})`;
  }
  return "Billed monthly";
}

export function getSaveLabel(plan: MembershipPlan, monthlyPlan?: MembershipPlan): string {
  if (!monthlyPlan || plan.id === "monthly") return "Most flexible";
  const savings = Math.round((1 - plan.price_eur / monthlyPlan.price_eur) * 100);
  return savings > 0 ? `Save ${savings}% compared to monthly` : "";
}
