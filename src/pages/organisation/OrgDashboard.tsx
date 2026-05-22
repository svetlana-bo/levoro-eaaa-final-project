import { Clock, UserPlus, KeyRound, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/organisation/PageHeader";
import { StatCard } from "@/components/organisation/StatCard";
import { QuickActionCard } from "@/components/organisation/QuickActionCard";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { useOrgDashboardData } from "@/hooks/useOrgDashboardData";
import { relativeTime } from "@/lib/relativeTime";

function actionLabel(action: string) {
  return action.replace(/_/g, " ");
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default function OrgDashboard() {
  const { companyId, company } = useCurrentCompany();
  const { data } = useOrgDashboardData(companyId);

  const renewsIn = daysUntil(company?.license_expires_at);
  const attention: { text: string; count?: number }[] = [];
  if ((data?.invitesStale ?? 0) > 0) {
    attention.push({ text: "Invites unaccepted for 14+ days", count: data!.invitesStale });
  }
  if ((data?.overdueLearners ?? 0) > 0) {
    attention.push({ text: "Learners with overdue enrolments", count: data!.overdueLearners });
  }
  if (renewsIn !== null && renewsIn <= 30 && renewsIn >= 0) {
    attention.push({ text: `License renews in ${renewsIn} days` });
  }

  const subtitle =
    attention.length === 0
      ? "Nothing urgent right now."
      : `${attention.length} item${attention.length === 1 ? "" : "s"} need attention.`;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        companyName={company?.name ?? "Organisation"}
        crumb="Dashboard"
        title="Operational overview"
        subtitle={subtitle}
        actions={
          <>
            <Button variant="secondary" disabled>
              Run a report
            </Button>
            <Button disabled>Invite users</Button>
          </>
        }
      />

      {/* Quick actions */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
          <QuickActionCard
            label="Invite users"
            description="Add individuals or import a CSV"
            icon={UserPlus}
          />
          <QuickActionCard
            label="Assign course access"
            description="Enrol users or groups in training"
            icon={KeyRound}
          />
          <QuickActionCard
            label="Run a report"
            description="Export completion and compliance"
            icon={BarChart3}
          />
        </div>
      </section>

      {/* At a glance */}
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard
          stripe="apricot"
          label="Active learners"
          value={data?.activeLearners ?? "—"}
          hint="Currently enrolled"
        />
        <StatCard
          stripe="gold"
          label="Pending invites"
          value={data?.pendingInvites ?? "—"}
          hint="Awaiting acceptance"
        />
        <StatCard
          stripe="danger"
          label="At risk"
          value={data?.atRisk ?? "—"}
          hint="Enrolments past due date"
        />
      </section>

      {/* Two-column lower row */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Needs your attention
          </h2>
          {attention.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to review right now.</p>
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((item, i) => (
                <li key={i} className="flex items-center justify-between py-3 text-sm">
                  <span className="flex items-center gap-3 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{item.text}</span>
                    {item.count !== undefined && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {item.count}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    disabled
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground opacity-60"
                  >
                    Review
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent activity
          </h2>
          {(data?.feed?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {data!.feed.map((entry: any) => (
                <li key={entry.id} className="text-sm text-muted-foreground">
                  <span className="text-foreground/80">{relativeTime(entry.occurred_at)}</span>{" "}
                  · <span className="text-foreground">{entry.actor_name}</span>{" "}
                  <span>{actionLabel(entry.action)}</span>
                  {entry.target_type ? <span> {entry.target_type}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
