import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/organisation/PageHeader";
import { AvatarStack } from "@/components/organisation/AvatarStack";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { useOrgGroups } from "@/hooks/useOrgGroups";

export default function OrgGroups() {
  const { companyId, company } = useCurrentCompany();
  const { groups, isLoading } = useOrgGroups(companyId);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        companyName={company?.name ?? "Organisation"}
        crumb="Groups & departments"
        title="Groups & departments"
        subtitle={`${groups.length} group${groups.length === 1 ? "" : "s"}`}
        actions={<Button disabled>Create group</Button>}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading groups…</p>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No departments yet. Assign a department to a user to see groups here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.name} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-foreground">{group.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {group.members.length} member{group.members.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="mb-4">
                <AvatarStack
                  people={group.members.map((m) => ({
                    name: m.full_name ?? "Member",
                    avatarUrl: m.avatar_url,
                  }))}
                />
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                — courses assigned · —% avg. completion
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled>View</Button>
                <Button variant="ghost" size="sm" disabled>Edit</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
