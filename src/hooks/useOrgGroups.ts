import { useMemo } from "react";
import { useOrgUsers, OrgMember } from "./useOrgUsers";

export type OrgGroup = {
  name: string;
  members: OrgMember[];
};

export function useOrgGroups(companyId: string | null) {
  const usersQuery = useOrgUsers(companyId);
  const groups = useMemo<OrgGroup[]>(() => {
    const map = new Map<string, OrgMember[]>();
    for (const u of usersQuery.data ?? []) {
      const key = (u.department && u.department.trim()) || "Unassigned";
      const arr = map.get(key) ?? [];
      arr.push(u);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([name, members]) => ({ name, members }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [usersQuery.data]);

  return { ...usersQuery, groups };
}
