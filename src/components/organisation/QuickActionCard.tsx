import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  label: string;
  description: string;
  icon: LucideIcon;
}

export function QuickActionCard({ label, description, icon: Icon }: QuickActionCardProps) {
  return (
    <button
      type="button"
      disabled
      className="group flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left opacity-60"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
