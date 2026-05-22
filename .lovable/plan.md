## Add value strip to top of Courses page

The same value strip already exists at the bottom of `/courses` (the "Everything included in one membership" section with the four pills: Unlimited Access, ~5-minute lessons, Completion certificates, Worksheets/templates & tools). It matches the screenshot.

### Change
In `src/pages/OurCourses.tsx`, render the existing `features` strip near the top of the page, right after the compact page header / breadcrumb section (around line ~350, before the filters/results area).

- Reuse the same `features` array and pill markup that's used at the bottom (icons + label, rounded card, border, light background).
- Keep it gated on `!isSubscribed` (same as the bottom one) so paying members don't see redundant value props.
- Container: `max-w-[1200px] mx-auto px-5`, grid `grid-cols-2 md:grid-cols-4 gap-4`, modest vertical padding (`py-4 md:py-5`) so it reads as a slim strip rather than a full section.
- No heading above it at the top (the heading "Everything included in one membership" stays only on the bottom reinforcement block).

### Optional cleanup
Leave the bottom reinforcement block as-is for now — it still works as closing reinforcement. If you'd prefer to avoid duplication, we can remove the bottom one in the same change; let me know.

No other files, routes, or data changes.