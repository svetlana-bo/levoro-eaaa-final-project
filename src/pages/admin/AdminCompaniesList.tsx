import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { TierPill } from "@/components/admin/TierPill";
import { LicensePill, licenseDisplay } from "@/components/admin/LicensePill";
import { SeatsProgress } from "@/components/admin/SeatsProgress";
import { useAdminCompanies } from "@/hooks/useAdminCompanies";
import { supabase } from "@/integrations/supabase/client";

export default function AdminCompaniesList() {
  const navigate = useNavigate();
  const { data: companies = [], isLoading, refetch } = useAdminCompanies();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [seeded, setSeeded] = useState(false);

  // Idempotent member seed: run once per session if we have seed companies but no members yet.
  useEffect(() => {
    if (seeded || isLoading) return;
    if (companies.length === 0) return;
    setSeeded(true);
    void supabase.functions.invoke("b2b-admin-seed-members").catch(() => undefined);
  }, [companies, isLoading, seeded]);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        (c.domain ?? "").toLowerCase().includes(t),
    );
  }, [companies, search]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return (
    <div className="mx-auto max-w-6xl">
      <AdminBreadcrumb trail={[{ label: "Levoro Admin" }, { label: "Companies" }]} />
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All B2B customers using the Levoro platform.
          </p>
        </div>
        <Button className="rounded-full" onClick={() => navigate("/admin/companies/new")}>
          Create company
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies by name or domain"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="rounded-full pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            {["Tier", "License status"].map((c) => (
              <button
                key={c}
                disabled
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground opacity-60"
              >{c}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Tier</th>
                <th className="px-4 py-2 font-medium">Users</th>
                <th className="px-4 py-2 font-medium">License</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Loading companies…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No companies match.</td></tr>
              ) : rows.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  onClick={() => navigate(`/admin/companies/${c.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.domain ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3"><TierPill tier={c.tier} /></td>
                  <td className="px-4 py-3"><SeatsProgress used={c.seats_used} total={c.seat_count} /></td>
                  <td className="px-4 py-3">
                    <LicensePill status={licenseDisplay(c.license_status, c.license_expires_at)} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <TooltipProvider delayDuration={150}>
                      <div className="flex justify-end gap-1 text-muted-foreground">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/admin/companies/${c.id}`} className="rounded p-1 hover:bg-muted">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>View company</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button disabled className="rounded p-1 opacity-50">
                              <Pencil className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Edit company</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <div>Showing {total === 0 ? 0 : start + 1}–{Math.min(start + pageSize, total)} of {total}</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span>Page {safePage} of {pageCount}</span>
              <Button variant="ghost" size="sm" disabled={safePage >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
