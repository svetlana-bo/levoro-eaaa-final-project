// Stage 2/3: default test company. Stage 7 will swap this for the logged-in
// user's profiles.company_id once auth gating is wired up.
//
// During Stage 3, Mari can drop into a specific company via "View as admin";
// that override lives in viewAsContext and is preferred when set.

import { getViewAsCompanyId } from "@/lib/viewAsContext";

export const DEFAULT_TEST_COMPANY_ID = "0f212b86-b1ca-42d2-88d0-fc5c633deb28";

export function getCurrentCompanyId(): string {
  if (typeof window === "undefined") return DEFAULT_TEST_COMPANY_ID;
  return getViewAsCompanyId() ?? DEFAULT_TEST_COMPANY_ID;
}
