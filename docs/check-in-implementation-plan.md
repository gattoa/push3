# Check-In System — Implementation Plan

> Consolidates all decisions and discoveries from the debugging session into a prioritized execution plan.

## What We Learned This Session

1. **The original banner bug:** A stale `check_ins` row was blocking the banner on your user. Caused by manual test data from an earlier session. Deleted.

2. **The hidden returning-user bug:** After check-in submission, `/plan` does not auto-trigger generation for users with a previous plan. The page shows a "Check In" empty state CTA, creating a loop. This bug has existed since commit `e677317` when the synchronous `/plan/generate` page was removed in favor of async generation on `/plan`.

3. **Docs were out of date:** Multiple references to "Sunday for POC" after the team had already shipped auto-computed check-in day in commit `b8c1f60`. Fixed.

4. **The banner is the wrong pattern:** Check-in is core to the product loop. A dismissible banner with 48-hour expiry can hide the only path forward. It should be a page state, not a banner.

5. **Calendar boundaries are hard rules:** Weeks are Monday–Sunday (commit `5564bce`). Work from week N cannot leech into week N+1. The design has to respect this.

6. **The design converged on three states (refined to two visible):**
   - State 1: Normal workout flow (unchanged)
   - State 2: End-of-week check-in (with two content variants: all-resolved or incomplete-workouts-present)
   - The "Monday gate" is functionally identical to State 2 — no separate UI

---

## Priority Order

### P0 — Unblock You (Now)
**Goal:** You can check in and generate next week's plan.

1. **Manual unblock** — use the browser console workaround documented above to check in and trigger generation for your current situation. One-time, non-code.

### P1 — Fix The Blocker Bug (This Branch)
**Goal:** The check-in → generate flow works correctly for all users without manual intervention.

**Root cause:** `/plan` does not auto-trigger generation for returning users.

**Fix:** Change the generation trigger logic to fire whenever there's no plan for the current calendar week AND the most recent plan is `completed` (indicating check-in has happened). The current `!hasPreviousPlan` gate was a proxy for "new user" that broke for returning users.

**Files to change:**
- `src/routes/(app)/plan/+page.server.ts` — return a new status `needs_generation` (or equivalent) when last plan is completed
- `src/routes/(app)/plan/+page.svelte` — trigger generation on that status

**Tests to verify:**
- New user with no plans → generation triggers (unchanged)
- Returning user with completed plan and submitted check-in → generation triggers (currently broken, this fixes it)
- Returning user with active plan (mid-week) → no generation triggers (current behavior preserved)

### P2 — Server Guards (This Branch)
**Goal:** Prevent invalid operations that could re-create the state corruption we just cleaned up.

1. **Guard `/api/swap-days` against completed plans.** Return 409 if the plan's status is `completed`. Already flagged in `check-in-flow.md`.
2. **Guard `/api/generate-plan` more carefully.** Should only allow generation when either (a) user has no plans at all, or (b) most recent plan is `completed`. Prevents mid-week generation bypass.

### P3 — Remove Diagnostic Logging (This Branch)
**Goal:** Clean up debug logs before merging.

- Remove `[banner-debug]` console.log from `src/routes/(app)/workout/+page.server.ts`

### P4 — Implement State 2 Page State (Next Session)
**Goal:** Replace banner-based check-in prompt with the page state design from `docs/design/pages/check-in-flow.md` and wireframes at `docs/design/pages/check-in-flow-wireframes.md`.

**Subtasks:**
1. New trigger logic in `src/routes/(app)/workout/+page.server.ts`:
   ```
   if (today has actionable work) → normal workout
   else if (today >= max(training_days)) → State 2
   else → rest day state
   ```
2. New `WeekEndState.svelte` (or similar) component implementing State 2 wireframe
3. `/workout/+page.svelte` selects between `WorkoutSession`, `WeekEndState`, and existing rest day state
4. Remove the existing banner logic for check-in (keep plan-review banner — that one is still a transient notification)
5. Remove dismissal/expiry code paths for the check-in banner

### P5 — Persistent Check-In Entry on `/plan` (Next Session)
**Goal:** Secondary path to check-in that doesn't depend on the workout page.

- Always-visible check-in link/button in the `/plan` header or as a footer action
- Enabled when check-in is actionable (today >= max training day, no submitted check-in for current plan)
- Disabled (with tooltip/hint) earlier in the week

### P6 — "Do Today" Swap Action in State 2 (Next Session)
**Goal:** Implement the incomplete-workout recovery flow.

- Client-side handler on the `Do Today →` button in State 2b
- Calls existing `/api/swap-days` with today's day and the incomplete day
- On success, invalidates page data → component re-renders → State 1 with the swapped workout

### P7 — Update Stale Docs (Next Session)
**Goal:** Ensure all docs reflect the current design.

- `daily-workout.md` — update Banner System section to reflect page-state approach
- `check-in.md` — update Entry Point section (persistent link on /plan + page state on /workout, not just banner)
- Mark the current `banner.ts` utility as deprecated (or adapt for plan-review only)

### P8 — Deferred (Future, Separate Work)
These came up in discussion but are explicitly out of scope for this work:

- **Week 0 baseline check-in concept** — documented in `docs/baseline-check-in-analysis.md`. Recommended approach is Path D (first real check-in doubles as baseline) when photos/body stats become priority.
- **Moving skipped workouts to other days** — mostly supported by existing swap-days, but the UX entry point is buried in Edit mode. Could be improved.
- **Manual override UI** — documented earlier in `docs/manual-overrides-plan.md`, deferred in favor of better generation.

---

## What Stays in This Branch vs. Next Branch

### `fix/check-in-banner` (current branch)
- P1: Fix returning-user generation trigger
- P2: Server guards
- P3: Remove diagnostic logging
- All the docs we wrote this session

**Rationale:** This branch was created to fix the banner bug. The returning-user bug is in the same functional area and blocks you from using the app. Server guards protect the integrity of the fix. The docs capture the design we landed on. This is a coherent unit.

### Next branch (`feat/check-in-page-state` or similar)
- P4: State 2 implementation
- P5: Persistent check-in entry on `/plan`
- P6: "Do Today" swap action
- P7: Doc updates reflecting new UX

**Rationale:** This is a UX redesign. It's non-trivial. It should be its own branch with its own review. It builds on the bug fixes from the current branch but is architecturally separate.

### Future (after validation)
- P8 items as they become priorities

---

## Open Questions (Decide Before Implementation)

These are marked in `check-in-flow.md` but worth surfacing:

1. **What does `/plan` show during State 2?** Current thinking: mirror the state with the same summary + CTA. Need to decide if `/plan` also hides the week agenda in that state, or shows both.

2. **Animation between State 1 and State 2.** When the user completes the last set of their last workout and transitions into State 2 — is that a fade? A slide? Instant? Implementation detail, but affects the "feel" of the moment.

3. **Zero-workout weeks.** User skips every workout, gets to Saturday with nothing done. State 2 should still show but the copy/summary should handle the `0 workouts · 0 volume` case gracefully. No guilt-trip copy.

4. **Edge case: user hasn't checked in for multiple weeks.** What if the calendar has rolled over multiple times without a check-in? The "most recent plan without a check-in" query handles this, but the UI should probably show the oldest unresolved plan first. Or we could auto-close old plans as skipped. Needs a decision.

---

## Summary

**Right now, in one minute of work:** manual browser console workaround to unblock you.

**This branch, 30-60 minutes of work:** P1 + P2 + P3. Fix the returning-user bug, add server guards, remove diagnostic logging. Merge to main.

**Next branch, multi-session work:** P4–P7. The full page state redesign with all the UX improvements from our discussion.

**Future:** P8 items as priorities dictate.
