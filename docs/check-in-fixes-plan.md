# Check-In System — Bug Fix & UX Gap Plan

## Problem Summary

The check-in banner should appear on the computed check-in day (day after last training day) on the Today screen. It's documented as working, was built previously, but is currently not triggering on Sunday for a user whose last training day was Saturday.

Beyond the bug itself, three related UX gaps exist in the broader check-in lifecycle.

---

## Bug: Check-In Banner Not Showing

### Expected Behavior (per `docs/design/pages/check-in.md`)
> **Check-in banner:** Appears when check-in day arrives. Lavender theme, `ClipboardCheck` icon. Navigates to `/check-in`. Persists 48 hours or until dismissed.

### Current State
Banner logic lives in `src/routes/(app)/workout/+page.server.ts`:

```typescript
const trainingDays = settings?.training_days ?? [];
const lastTrainingDay = trainingDays.length > 0 ? Math.max(...trainingDays) : 5;
const checkInDay = (lastTrainingDay + 1) % 7;
const isCheckInDay = dayIndex === checkInDay;

const { data: existingCheckIn } = await supabase
  .from('check_ins')
  .select('id')
  .eq('user_id', user.id)
  .eq('week_number', fullPlan.plan.week_number)
  .maybeSingle();

const showCheckInBanner = isCheckInDay && !existingCheckIn;
```

### User's Scenario
- Last training day: Saturday (day 5)
- Today: Sunday (day 6)
- Expected: `checkInDay = (5 + 1) % 7 = 6`, `isCheckInDay = true`
- Expected: No check-in submitted, no dismissal → banner shows
- Actual: Banner not showing

### Diagnostic Plan

The code path looks correct. Something in the data doesn't match. To identify which, add temporary logging to `workout/+page.server.ts`:

```typescript
console.log('[banner]', {
  dayIndex,
  trainingDays,
  lastTrainingDay,
  checkInDay,
  isCheckInDay,
  weekNumber: fullPlan.plan.week_number,
  existingCheckIn: existingCheckIn?.id ?? null,
  showCheckInBanner
});
```

Then load `/workout` and check the server log. One of three things will be true:

1. **`trainingDays` contains Sunday (6)** → `lastTrainingDay = 6`, `checkInDay = 0` (Monday), banner won't show on Sunday. Fix: investigate how `training_days` got that value (settings UI bug? stale data?).

2. **`existingCheckIn` is truthy** → a check-in row already exists for `fullPlan.plan.week_number`. Fix: investigate why. Could be a stale row from a previous week with the same `week_number`, or an accidental insert.

3. **`weekNumber` is unexpected** → plan's `week_number` doesn't match the current week. Fix: investigate plan generation week numbering.

Remove the logging once the root cause is identified.

### Additional Consideration — Check-In Day Source of Truth

The code computes `check_in_day` from `training_days` on every page load:
```typescript
const checkInDay = (lastTrainingDay + 1) % 7;
```

But the value is **also stored** in `user_settings.check_in_day` (written in onboarding and settings). The workout page ignores the stored value and recomputes. This is inconsistent.

**Recommendation:** Use the stored `user_settings.check_in_day` as source of truth. The settings UI already recomputes and saves it when training days change. The workout page should read it, not recompute. This eliminates a class of potential drift bugs.

---

## UX Gap 1: Moving a Skipped Workout to Another Day

### Problem
User skipped Monday's workout and considered moving it to Sunday (normally a rest day). No mechanism exists to do this. The existing "Edit" mode on the Plan page swaps content between two days — it doesn't move a skipped workout to a rest day.

### Scope
This is a genuinely new feature. It affects:
- The Plan page — needs a way to drag/move a skipped day
- The Workout page — Sunday would need to show the moved workout instead of the rest state
- Data model — a skipped day's content needs to be movable without breaking `day_index` ordering

### Recommendation
**Defer.** This is a significant feature that deserves its own discovery phase. Related to the manual overrides work already deferred. Note it as a real user need but don't tackle it alongside the bug fix.

---

## UX Gap 2: Post-Check-In Communication on Workout Page

### Problem
After submitting a check-in, the flow is:
1. Check-in saved to `check_ins`
2. `user_settings` updated
3. Old plan marked `completed`
4. Redirect to `/plan/generate` → new plan generation starts
5. User lands on `/plan` which shows generation state

But if the user navigates back to `/workout` during or after generation, the page has **no awareness** of these states:
- **Generating:** Should say "Your new plan is being built" or similar
- **Ready to preview:** Should say "Your new plan is ready — preview it" (the existing plan-review banner handles this, but only if `week_number > 1` AND plan is < 48h old)

### Current State
The plan-review banner exists and handles the "ready to preview" case reasonably well. The gap is the **generating** state on the workout page.

### Recommendation
Add a third banner type: `plan-generating`. Shows when:
- User has submitted a check-in for the current/previous plan
- A new plan is in `generating` status (not yet active)
- User is on `/workout`

Visual: lavender/reflect theme (check-in aftermath), spinner icon, message "Your next plan is being built...". Non-dismissible (it auto-clears when the new plan becomes active). No navigation action — it's informational.

Banner priority becomes: `plan-generating` > `check-in` > `plan-review`.

---

## UX Gap 3: Manual Check-In Entry from Plan Page

### Problem
The only entry point to `/check-in` is the banner on `/workout`. If the banner doesn't show (bug, dismissed, or pre-check-in-day), the user has no way to manually trigger a check-in.

The `/plan` page has a check-in CTA, but **only when no plan exists for the current week**. That's the wrong condition — a user might want to check in early on a day that's not their computed check-in day, or after dismissing the banner.

### Recommendation
Add a persistent but context-aware check-in entry on `/plan`:
- **Visible always** (users should know check-in exists)
- **Active (enabled)** when:
  - It's the check-in day or later in the week
  - No check-in has been submitted for the current plan's week
- **Inactive (disabled with subtle hint)** when:
  - The week isn't far enough along yet (e.g., it's Tuesday and check-in isn't until Sunday)
  - A check-in has already been submitted

Placement: near the week header, or as a small footer button. Style: secondary CTA, not primary — it shouldn't compete with the daily workout flow.

The docs currently say "Previous entry points (agenda header link, workout completion button) have been removed to reduce duplication and consolidate the check-in trigger into the banner system." This was the right call when the banner reliably worked, but the banner being a single point of failure is the root of the current bug. A fallback entry point from the Plan page is a safety net.

---

## Execution Plan

### Phase 1: Diagnose and Fix the Bug (Priority: High)
1. Add temporary logging to `workout/+page.server.ts` banner logic
2. Load `/workout` and inspect server log
3. Identify which of the three data mismatches is occurring
4. Fix the root cause
5. Remove logging
6. Verify banner appears on next check-in day

### Phase 2: Make Check-In Day Source of Truth Consistent (Priority: Medium)
- Update `workout/+page.server.ts` to read `user_settings.check_in_day` instead of recomputing from `training_days`
- Verify settings UI keeps `check_in_day` in sync (it already does per the code)
- Remove the recomputation logic

### Phase 3: Add `plan-generating` Banner (Priority: Medium)
- Extend banner type union in `workout/+page.server.ts` to include `'plan-generating'`
- Add detection logic: user has check-in for previous week + plan in `generating` status
- Update `Banner.svelte` to support the new type (lavender theme, spinner icon)
- Update priority ordering in `workout/+page.svelte`
- The banner auto-clears when the new plan becomes `active` (next page load)

### Phase 4: Add Check-In Entry on Plan Page (Priority: Medium)
- Add a small, context-aware check-in link/button on `/plan`
- Visible always, enabled/disabled based on whether check-in is available for the current week
- Does not compete visually with the primary daily workout flow

### Phase 5 (Deferred): Moving Skipped Workouts
- Separate discovery and design phase
- Related to the manual overrides work already deferred
- Note as a real user need
