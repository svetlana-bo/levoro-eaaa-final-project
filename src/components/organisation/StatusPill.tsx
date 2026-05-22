import { cn } from "@/lib/utils";

export type AccountStatus = "active" | "pending" | "at_risk" | "complete" | "disabled";

const LABEL: Record<AccountStatus, string> = {
  active: "Active",
  pending: "Pending",
  at_risk: "At risk",
  complete: "Complete",
  disabled: "Disabled",
};

const COLOR: Record<AccountStatus, string> = {
  active: "bg-[hsl(var(--success))]",
  pending: "bg-[hsl(var(--gold))]",
  at_risk: "bg-[hsl(var(--destructive))]",
  complete: "bg-[hsl(var(--slate-blue))]",
  disabled: "bg-muted-foreground",
};

export function StatusPill({ status }: { status: AccountStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", COLOR[status])} aria-hidden />
      {LABEL[status]}
    </span>
  );
}

/** Map a profiles.status enum value to the visual account status. */
export function mapMemberStatus(raw: string | null | undefined): AccountStatus {
  switch (raw) {
    case "active":
      return "active";
    case "invited":
      return "pending";
    case "disabled":
      return "disabled";
    default:
      return "active";
  }
}
