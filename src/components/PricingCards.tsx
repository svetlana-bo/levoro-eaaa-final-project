import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MembershipPlan,
  getBillingLabel,
  getSaveLabel,
} from "@/hooks/useMembershipPlans";

interface PricingCardsProps {
  plans: MembershipPlan[];
  monthlyPlan?: MembershipPlan;
  loadingPlan: string | null;
  onSubscribe: (planId: string) => void;
  formatPrice: (eur: number, planId?: string) => string;
  getPrice: (eur: number, planId?: string) => number;
}

export default function PricingCards({
  plans,
  monthlyPlan,
  loadingPlan,
  onSubscribe,
  formatPrice,
  getPrice,
}: PricingCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`bg-card rounded-2xl p-8 relative transition-all duration-300 hover:-translate-y-1 border ${
            plan.is_featured
              ? "border-secondary/50 shadow-xl mesh-gradient"
              : "border-border/50 shadow-md"
          }`}
        >
          {plan.badge && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-xs font-bold tracking-wider shadow-md whitespace-nowrap">
              <CheckCircle className="h-3.5 w-3.5" />
              {plan.badge}
            </div>
          )}
          <h3 className="text-xl font-extrabold text-primary mb-3">{plan.title}</h3>
          <p className="text-slate-blue text-2xl font-bold mb-1">
            {formatPrice(plan.price_eur, plan.id)}
            <span className="text-base font-medium text-muted-foreground"> /mo</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {getBillingLabel(plan, formatPrice, getPrice)}
          </p>
          <div className="space-y-3 mb-8">
            {plan.features.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2.5 bg-muted/40 rounded-lg px-4 py-3"
              >
                <CheckCircle className="h-4 w-4 text-slate-blue shrink-0" />
                <span className="text-foreground text-base">{f}</span>
              </div>
            ))}
          </div>
          <Button
            variant="hero"
            size="lg"
            className="w-full uppercase tracking-widest font-bold"
            onClick={() => onSubscribe(plan.id)}
            disabled={loadingPlan === plan.id}
          >
            {loadingPlan === plan.id ? "Processing..." : "Get Full Access"}
          </Button>
          <p className="text-xs text-center mt-3 text-muted-foreground">
            <strong className="text-secondary">{getSaveLabel(plan, monthlyPlan)}</strong>
          </p>
        </div>
      ))}
    </div>
  );
}
