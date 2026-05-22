import { Building2, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInstructorContext } from "@/hooks/useInstructorContext";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export function InstructorContextSwitcher() {
  const { isMember, mode, setMode, companyName } = useInstructorContext();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (!isMember) return null;

  if (collapsed) {
    return (
      <TooltipProvider>
        <div className="px-2 pb-2 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setMode(mode === "company" ? "personal" : "company")}
                aria-label="Switch context"
              >
                {mode === "company" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {mode === "company" ? `Viewing as ${companyName} (company)` : "Viewing as yourself"}
              <div className="text-xs text-muted-foreground mt-0.5">Click to switch</div>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="px-3 pb-2 space-y-1">
      <p className="text-xs text-sidebar-foreground/60 px-1">Viewing as</p>
      <Select value={mode} onValueChange={(v) => setMode(v as "company" | "personal")}>
        <SelectTrigger className="h-9 text-sm bg-sidebar-accent/40 border-sidebar-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="company">
            <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {companyName || "Company"}</span>
          </SelectItem>
          <SelectItem value="personal">
            <span className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Personal</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
