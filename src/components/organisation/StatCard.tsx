import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type Stripe = "apricot" | "gold" | "danger";

const STRIPE: Record<Stripe, string> = {
  apricot: "bg-[hsl(var(--apricot))]",
  gold: "bg-[hsl(var(--gold))]",
  danger: "bg-[hsl(var(--destructive))]",
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  stripe: Stripe;
}

export function StatCard({ label, value, hint, stripe }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className={cn("h-1.5 w-full", STRIPE[stripe])} aria-hidden />
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
