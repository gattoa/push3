# Check-In System — Implementation Plan

> Consolidates all decisions and discoveries from the debugging session into a prioritized execution plan.
> Last updated after PRs #20–23 shipped.

## What We Learned

1. **Stale check-in data** blocked the banner. A leftover `check_ins` row from testing made the system think the user had already checked in. Deleted manually.

2. **Returning-user generation bug.** After check-in, `/plan` didn't auto-trigger generation for users with a previous plan — showing a "Check In" CTA that looped. Existed since commit `e677317`.

3. **Completed plan blocking generation.** `getFullPlan` returned completed plans as if they were current. `/plan` showed the old plan instead of triggering generation. Generation also targeted the same `week_start_date` as the completed plan, hitting the unique constraint.

4. **Stale workout pages.** `/workout` and `/workout/[day]` had the same stale-plan problem — they loaded the completed plan instead of the new one.

5. **Week number skip.** The date-advancement fix incorrectly incremented `week_number`, causing week 1 → 3.

6. **Docs were out of date.** Multiple references to "Sunday for POC" after the team had shipped auto-computed check-in day.

7. **The banner is the wrong pattern.** Check-in is core to the product loop. A dismissible banner with 48-hour expiry can hide the only path forward. Should be a page state. Design captured separately.

8. **Calendar boundaries are hard rules.** Weeks are Monday–Sunday (commit `5564bce`). Work from week N cannot leech into week N+1.

---

## What Shipped

### PR #20 — Check-in flow unblock + server guards
- Replaced `hasPreviousPlan` with `needsCheckIn` signal on `/plan` — auto-triggers generation for returning users whose most recent plan is completed
- Server guards: `/api/swap-days`, `/api/swap-exercise`, `/api/reorder-exercises` reject modifications to completed plans (409)
- Server guard: `/api/generate-plan` rejects generation when there's an active plan from a previous week awaiting check-in
- Removed diagnostic logging
- Fixed stale docs (check-in day references)

### PR #21 — Completed plan blocking generation
- `/plan` now treats completed plans as "no plan" so generation triggers
- Generation advances `week_start_date` to next Monday when a completed plan exists for the target week

### PR #22 — Week number skip + polling
- Removed erroneous `next_week_number` increment that caused week 1 → 3 skip
- Replaced "Try Again" button with continued slow polling — prevents expensive duplicate Claude API calls

### PR #23 — Show next week's plan after check-in
- `/plan` checks next Monday if this week's plan is completed

### PR #24 (pending) — Shared `getCurrentPlan` helper
- Single helper function used by `/plan`, `/workout`, and `/workout/[day]`
- Checks this week first, falls through to next week if completed
- Eliminates stale workout pages showing last week's data

---

## What's Next (Not Yet Implemented)

### P4 — Implement State 2 Page State
Replace the dismissible banner with a page state on `/workout` when check-in is available.

**Design docs:**
- `docs/design/pages/check-in-flow.md` — full design
- `docs/design/pages/check-in-flow-wireframes.md` — wireframes

**Scope:**
- New trigger logic in `/workout/+page.server.ts`
- New `WeekEndState.svelte` component
- `/workout/+page.svelte` selects between workout, week-end state, and rest day
- Remove check-in banner dismissal/expiry logic (keep plan-review banner)

### P5 — Persistent Check-In Entry on `/plan`
Always-visible check-in link/button on the plan page. Enabled when actionable, disabled otherwise. Secondary path so the workout page isn't the only way to check in.

### P6 — "Do Today" Swap Action in State 2
The incomplete-workout recovery flow from the wireframes. Each unfinished workout shows a "Do Today" button that swaps it onto today via existing `/api/swap-days`.

### P7 — Update Remaining Docs
- `daily-workout.md` — update Banner System section to reflect page-state approach
- `check-in.md` — update Entry Point section
- Mark `banner.ts` utility as plan-review only

---

## Deferred (Separate Discovery)

- **Week 0 baseline check-in** — documented in `docs/baseline-check-in-analysis.md`
- **Manual override UI** — documented in `docs/manual-overrides-plan.md`
- **Push notifications for plan generation** — flagged during this session, no doc yet
- **Sluggishness investigation** — needs data from the user before any action

---

## Open Questions

1. **What does `/plan` show during State 2?** Mirror the week-end state, or keep the agenda visible with a check-in entry?
2. **Zero-workout weeks.** Summary should show honestly, no guilt-trip copy.
3. **Multiple missed weeks.** If the user disappears for weeks and returns, the "most recent plan without check-in" query handles it, but the UX hasn't been designed for that case.
