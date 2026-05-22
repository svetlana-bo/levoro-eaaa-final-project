import { useMemo, useState } from "react";
import { Pencil, KeyRound, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/organisation/PageHeader";
import { StatusPill, mapMemberStatus } from "@/components/organisation/StatusPill";
import { AvatarStack } from "@/components/organisation/AvatarStack";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { useOrgUsers, OrgMember } from "@/hooks/useOrgUsers";
import { relativeTime } from "@/lib/relativeTime";

type Tab = "all" | "students" | "instructors" | "admins" | "pending";

function matchesTab(m: OrgMember, tab: Tab): boolean {
  if (tab === "all") return true;
  if (tab === "pending") return m.status === "invited";
  if (tab === "students") return m.role === "company_student" || m.role === "student";
  if (tab === "instructors") return m.role === "instructor";
  if (tab === "admins") return m.role === "company_admin" || m.role === "admin";
  return true;
}

function initials(name: string | null) {
  if (!name) return "·";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function OrgUsers() {
  const { companyId, company } = useCurrentCompany();
  const { data: users = [], isLoading } = useOrgUsers(companyId);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter((m) => matchesTab(m, tab))
      .filter((m) =>
        term === ""
          ? true
          : (m.full_name ?? "").toLowerCase().includes(term),
      );
  }, [users, tab, search]);

  const pendingCount = users.filter((m) => m.status === "invited").length;
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        companyName={company?.name ?? "Organisation"}
        crumb="Users"
        title="User management"
        subtitle={`${users.length} user${users.length === 1 ? "" : "s"}`}
        actions={
          <>
            <Button variant="secondary" disabled>
              Bulk invite
            </Button>
            <Button disabled>Invite user</Button>
          </>
        }
      />

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 pt-4">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setPage(1); }}>
            <TabsList className="bg-transparent p-0">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="instructors">Instructors</TabsTrigger>
              <TabsTrigger value="admins">Admins</TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                Pending invite
                {pendingCount > 0 && (
                  <span className="rounded-full bg-[hsl(var(--gold))] px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--gold-light))]">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="rounded-full pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            {["Department", "Status", "Course"].map((chip) => (
              <button
                key={chip}
                type="button"
                disabled
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground opacity-60"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Department</th>
                <th className="px-4 py-2 font-medium">Account status</th>
                <th className="px-4 py-2 font-medium">Activity</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Loading users…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No users to show.</td></tr>
              ) : (
                pageRows.map((m) => (
                  <tr key={m.user_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            initials(m.full_name)
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">{m.full_name ?? "Unnamed user"}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.user_id.slice(0, 8)}…
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{m.department ?? "—"}</td>
                    <td className="px-4 py-3"><StatusPill status={mapMemberStatus(m.status)} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{relativeTime(m.last_active_at)}</td>
                    <td className="px-4 py-3">
                      <TooltipProvider delayDuration={150}>
                        <div className="flex justify-end gap-1 text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" aria-label="Edit user" className="rounded p-1 hover:bg-muted">
                                <Pencil className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Edit user</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" aria-label="Reset password" className="rounded p-1 hover:bg-muted">
                                <KeyRound className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Reset password</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" aria-label="Remove user" className="rounded p-1 hover:bg-muted hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Remove user</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </td>
                  </tr>
                ))
              )}
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
              <Button variant="ghost" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <span>Page {safePage} of {pageCount}</span>
              <Button variant="ghost" size="sm" disabled={safePage >= pageCount} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
