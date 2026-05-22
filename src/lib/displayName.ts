export type InstructorTypeValue = "individual" | "company" | null | undefined;

export const getDisplayName = (
  p: {
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    instructor_type?: InstructorTypeValue;
  } | null | undefined,
  fallback = "Levoro Instructor",
) => {
  if (!p) return fallback;
  if (p.instructor_type === "company" && p.company_name?.trim()) {
    return p.company_name.trim();
  }
  const full = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
  return full || fallback;
};

export const getDisplayInitials = (
  p: {
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    instructor_type?: InstructorTypeValue;
  } | null | undefined,
  fallback = "LI",
) => {
  if (!p) return fallback;
  if (p.instructor_type === "company" && p.company_name?.trim()) {
    return p.company_name.trim().slice(0, 2).toUpperCase();
  }
  const initials = `${(p.first_name || "")[0] || ""}${(p.last_name || "")[0] || ""}`.toUpperCase();
  return initials || fallback;
};
