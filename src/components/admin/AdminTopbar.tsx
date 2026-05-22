import { Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

export function AdminTopbar() {
  return (
    <header className="flex h-[70px] items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-8">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <span className="text-lg font-semibold tracking-tight text-foreground">Levoro</span>
        <span className="inline-flex items-center rounded-full bg-[hsl(var(--gold))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--navy-dark))]">
          Admin
        </span>
      </div>
      <div className="hidden flex-1 max-w-md md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            disabled
            placeholder="Search the platform"
            className="rounded-full pl-9 opacity-60"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="hidden md:inline">Mari Lindberg</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
          ML
        </span>
      </div>
    </header>
  );
}
