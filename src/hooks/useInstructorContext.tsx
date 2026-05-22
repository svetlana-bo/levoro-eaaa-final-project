import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type InstructorMode = "company" | "personal";

interface Membership {
  company_id: string;
  member_role: string;
  instructor_companies: { id: string; name: string; slug: string | null } | null;
}

interface ContextValue {
  mode: InstructorMode;
  setMode: (m: InstructorMode) => void;
  isMember: boolean;
  companyId: string | null;
  companyName: string | null;
  memberRole: string | null;
  loading: boolean;
}

const Ctx = createContext<ContextValue | null>(null);

const STORAGE_KEY = "instructor-active-context";

export function InstructorContextProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: membership, isLoading } = useQuery({
    queryKey: ["instructor-self-membership", user?.id],
    queryFn: async (): Promise<Membership | null> => {
      // Two-step fetch to avoid PostgREST embed quirks
      const { data: member, error: mErr } = await supabase
        .from("instructor_company_members")
        .select("company_id, member_role")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (mErr) {
        console.error("[useInstructorContext] membership query failed", mErr);
        throw mErr;
      }
      if (!member) return null;
      const { data: company, error: cErr } = await supabase
        .from("instructor_companies")
        .select("id, name, slug")
        .eq("id", member.company_id)
        .maybeSingle();
      if (cErr) {
        console.error("[useInstructorContext] company lookup failed", cErr);
        throw cErr;
      }
      return {
        company_id: member.company_id,
        member_role: member.member_role,
        instructor_companies: company,
      } as Membership;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const isMember = !!membership?.instructor_companies;

  // resolve initial mode: URL > localStorage > default (company if member)
  const [mode, setModeState] = useState<InstructorMode>(() => {
    const urlCtx = searchParams.get("ctx");
    if (urlCtx === "personal" || urlCtx === "company") return urlCtx;
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored === "personal" || stored === "company") return stored;
    return "company";
  });

  // If not a member, force personal
  useEffect(() => {
    if (!isLoading && !isMember && mode !== "personal") {
      setModeState("personal");
    }
  }, [isLoading, isMember, mode]);

  const setMode = useCallback((m: InstructorMode) => {
    setModeState(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch {}
    const next = new URLSearchParams(searchParams);
    next.set("ctx", m);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const value = useMemo<ContextValue>(() => ({
    mode: isMember ? mode : "personal",
    setMode,
    isMember,
    companyId: membership?.instructor_companies?.id ?? null,
    companyName: membership?.instructor_companies?.name ?? null,
    memberRole: membership?.member_role ?? null,
    loading: isLoading,
  }), [isMember, mode, setMode, membership, isLoading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInstructorContext(): ContextValue {
  const v = useContext(Ctx);
  if (!v) {
    // Safe default when used outside provider
    return { mode: "personal", setMode: () => {}, isMember: false, companyId: null, companyName: null, memberRole: null, loading: false };
  }
  return v;
}
