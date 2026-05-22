import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { TierPill, TIER_DESCRIPTIONS } from "@/components/admin/TierPill";
import { LicensePill, licenseDisplay, daysUntil } from "@/components/admin/LicensePill";
import { StatCard } from "@/components/organisation/StatCard";
import { useAdminCompany, useCompanyAuditFeed } from "@/hooks/useAdminCompanies";
import { setViewAsCompanyId } from "@/lib/viewAsContext";
import { relativeTime } from "@/lib/relativeTime";

export default function AdminCompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: company, isLoading } = useAdminCompany(id);
  const { data: events = [] } = useCompanyAuditFeed(id);

  if (isLoading) return <div className="mx-auto max-w-6xl text-sm text-muted-foreground">Loading…</div>;
  if (!company) return <div className="mx-auto max-w-6xl text-sm text-muted-foreground">Company not found.</div>;

  const license = licenseDisplay(company.license_status, company.license_expires_at);
  const days = daysUntil(company.license_expires_at);

  function enterViewAs() {
    if (!id) return;
    setViewAsCompanyId(id);
    navigate("/organisation/dashboard");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <AdminBreadcrumb
        trail={[
          { label: "Levoro Admin" },
          { label: "Companies", to: "/admin/companies" },
          { label: company.name },
        ]}
      />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{company.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{company.domain ?? "—"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" disabled>Edit details</Button>
          <Button className="rounded-full" onClick={enterViewAs}>View as admin</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          stripe="apricot"
          label="Tier"
          value={<TierPill tier={company.tier} />}
          hint={TIER_DESCRIPTIONS[company.tier]}
        />
        <StatCard
          stripe="gold"
          label="Seats"
          value={`${company.seats_used} / ${company.seat_count}`}
          hint={`${Math.max(0, company.seat_count - company.seats_used)} seats available`}
        />
        <StatCard
          stripe={license === "expired" ? "danger" : license === "expiring_soon" ? "gold" : "apricot"}
          label="License"
          value={<LicensePill status={license} />}
          hint={
            days === null
              ? "No expiry set"
              : days <= 0
              ? "Expired"
              : `${days} day${days === 1 ? "" : "s"} remaining`
          }
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent activity</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {events.length === 0 ? (
              <li className="text-muted-foreground">No activity yet.</li>
            ) : (
              events.map((e: any) => (
                <li key={e.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-foreground">
                      <span className="font-medium">{e.actor_name}</span>{" "}
                      <span className="text-muted-foreground">{e.action.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(e.occurred_at)}</span>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active engagements</h2>
            <p className="mt-3 text-sm italic text-muted-foreground opacity-70">No active engagements.</p>
          </section>
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Support history</h2>
            <p className="mt-3 text-sm italic text-muted-foreground opacity-70">Available in a later stage.</p>
          </section>
        </div>
      </div>

      <div className="mt-6 text-xs text-muted-foreground">
        <Link to="/admin/companies" className="hover:text-foreground">← Back to companies</Link>
      </div>
    </div>
  );
}
