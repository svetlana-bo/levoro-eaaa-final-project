import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { clearViewAsCompanyId, getViewAsCompanyId, subscribeViewAs } from "@/lib/viewAsContext";
import { supabase } from "@/integrations/supabase/client";

export function ViewAsBanner() {
  const [companyId, setCompanyId] = useState<string | null>(() => getViewAsCompanyId());
  const [companyName, setCompanyName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => subscribeViewAs(() => setCompanyId(getViewAsCompanyId())), []);

  useEffect(() => {
    if (!companyId) {
      setCompanyName(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("v_b2b_companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setCompanyName(data?.name ?? "company");
      });
    return () => { cancelled = true; };
  }, [companyId]);

  if (!companyId) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/15 px-4 py-2 text-xs text-foreground md:px-8">
      <div className="min-w-0 truncate">
        <span className="font-semibold">Viewing as Levoro Admin</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="text-foreground">{companyName ?? "…"}</span>
      </div>
      <button
        type="button"
        onClick={() => {
          const id = companyId;
          clearViewAsCompanyId();
          navigate(`/admin/companies/${id}`);
        }}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 font-medium hover:bg-muted"
      >
        <X className="h-3 w-3" /> Exit view-as
      </button>
    </div>
  );
}
