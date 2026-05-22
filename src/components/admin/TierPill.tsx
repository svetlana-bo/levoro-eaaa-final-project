import { cn } from "@/lib/utils";

type Tier = "tier_1" | "tier_2" | "tier_3";

const LABEL: Record<Tier, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
};

const STYLE: Record<Tier, string> = {
  tier_1: "bg-[hsl(var(--apricot))] text-[hsl(var(--navy-dark))]",
  tier_2: "bg-[hsl(var(--gold-light))] text-[hsl(var(--navy-dark))]",
  tier_3: "bg-[hsl(var(--navy))] text-[hsl(var(--gold-light))]",
};

export function TierPill({ tier }: { tier: Tier }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLE[tier],
      )}
    >
      {LABEL[tier]}
    </span>
  );
}

export const TIER_DESCRIPTIONS: Record<Tier, string> = {
  tier_1: "Employee Learning Benefit",
  tier_2: "Internal Training Digitalization",
  tier_3: "Strategic Learning Partnership",
};
