# Quick Action Review Master Prompt

Use this prompt when reviewing or implementing any dashboard quick action. It should be pasted into a quick action body so the accordion opens and shows the plan inline (no new page).

- Goal: confirm the quick action is useful, scoped, and wired to real backend capabilities (roles: admin, staff/coach, parent, player).
- Inputs to gather first: current screen, selected quick action, target resource or endpoint, permissions required, desired outcomes, blockers.
- Checklist:
  1) UX: does the quick action open inside the accordion with clear context and no navigation away?
  2) Data: which API endpoints are read/written? Confirm payload shape and auth (Token header).
  3) Roles: who can see/use it? Validate against role rules and hide/disable if unauthorized.
  4) States: loading, empty, error, success, retry, optimistic updates.
  5) Observability: toasts or inline status for destructive actions; log errors to console for now.
  6) Completion criteria: what indicates the action is done? What follow-ups or links (if any) stay inside the accordion?
- Deliverable: a short implementation plan (steps, endpoints, components to touch) and a test pass list (manual + automated if applicable) kept inside the accordion content. This should be concise and immediately actionable.***
