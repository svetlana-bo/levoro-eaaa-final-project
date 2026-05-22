import { cn } from "@/lib/utils";

export type LicenseDisplay = "active" | "expiring_soon" | "expired";

const LABEL: Record<LicenseDisplay, string> = {
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
};

const DOT: Record<LicenseDisplay, string> = {
  active: "bg-[hsl(var(--success))]",
  expiring_soon: "bg-[hsl(var(--gold))]",
  expired: "bg-[hsl(var(--destructive))]",
};

export function licenseDisplay(
  status: string | null | undefined,
  expiresAt: string | null | undefined,
): LicenseDisplay {
  if (status === "expired" || status === "cancelled") return "expired";
  if (!expiresAt) return status === "active" ? "active" : "expired";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  if (ms <= 30 * 86400_000) return "expiring_soon";
  return "active";
}

export function daysUntil(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400_000);
}

export function LicensePill({ status }: { status: LicenseDisplay }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} aria-hidden />
      {LABEL[status]}
    </span>
  );
}
