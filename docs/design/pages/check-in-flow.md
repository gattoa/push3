# Check-In Flow — Page State Design

> Replaces the banner-based check-in prompt with a page state on `/workout`. Grounded in the hard rule that weeks are calendar-anchored (Monday–Sunday) and cannot leech into each other.

## The Hard Rules (Do Not Violate)

These are established constraints from the existing system (commit `5564bce`, "calendar-anchored plans"):

1. **A week is Monday through Sunday.** Determined by `getCurrentMonday()` in the user's local timezone.
2. **Plans are anchored to `weekly_plans.week_start_date`**, which is the Monday of the ISO calendar week.
3. **Each user has at most one plan per calendar week.**
4. **Work belongs to the week in which it was logged.** A set logged on Monday belongs to this week's plan, not last week's.
5. **Sunday at midnight is a hard close.** Once the calendar rolls over, last week's plan is historically closed — no new logs, no swaps, no "catch-up" actions.

## The Problem

The current banner-based check-in prompt has several failure modes:

1. **Dismissible and expiring** — users can permanently hide the only path to the next week's plan. Check-in is core to the loop; it should never be dismissible.
2. **Triggers only on the computed check-in day** — users who miss that day have no visible path to check in until the next weekly cycle (or never).
3. **No concept of a "week wrap-up" state** — on the day after training, `/workout` shows stale content (yesterday's exercises) with a banner on top, instead of acknowledging the week is ending.
4. **No handling of the Monday gate** — if the user hasn't checked in by Sunday night, Monday's UX is undefined. They land on `/workout` or `/plan` with no plan for this week and no clear action.
5. **No handling of incomplete work** — users who skipped workouts mid-week have no way to attempt them later without navigating to the Plan page's Edit mode (an unrelated surface).

## The Design

### States

Three mutually exclusive states on `/workout`, determined on page load:

#### State 1: Normal Workout Flow
**When:** Today is a scheduled workout day within the current calendar week, and a workout exists in the plan for today.

**Shows:** Existing workout session UI (unchanged).

#### State 2: End-of-Week Check-In (Same Calendar Week)
**When:**
- Today is within the same calendar week as the active plan, AND
- Today is after `max(user_settings.training_days)` (the last declared training day), AND
- Today has no scheduled workout (covers both rest days and days swapped into rest via the Plan page's Edit mode).

**Shows:**
```
Header: Day + Date (e.g., "Saturday, Apr 5")
Sub-header: "Your training week"

┌─ Week Summary ─────────────┐
│ • 2 workouts completed     │
│ • 1 PR                      │
│ • 8,400 lb total volume    │
└────────────────────────────┘

[If there are incomplete workouts, show each as a swap-to-today action:]

Still on your plan:

┌─ Monday — Push ────────────┐
│ 5 exercises, 15 sets        │
│                   Do Today →│
└────────────────────────────┘

──────── or ────────

[Primary CTA — adaptive]
┌────────────────────────────┐
│  Skip Remaining & Check In │  ← if incomplete workouts exist
└────────────────────────────┘

or

┌────────────────────────────┐
│        Check In            │  ← if all workouts resolved
└────────────────────────────┘
```

**Interactions:**
- **"Do Today" button** on an incomplete workout → calls `/api/swap-days` to swap today's day with the incomplete day. Today now has the workout; the incomplete day becomes rest. Page re-renders as State 1 with the swapped workout.
- **"Skip Remaining & Check In"** → navigates to `/check-in`. Any still-unlogged sets from the week will be recorded as skipped on submission (existing behavior).
- **"Check In"** → navigates to `/check-in`.

**Not dismissible. No expiry.** The state persists as long as the conditions are true.

#### State 3: Monday Gate (Calendar Rolled Over, No Check-In)
**When:**
- The calendar week has rolled over (today is in a new ISO week), AND
- No plan exists for the current calendar week, AND
- The most recent plan (last week's) has no check-in submitted yet.

**Shows:**
```
Header: Day + Date (e.g., "Monday, Apr 7")
Sub-header: "Check in to generate this week's plan"

┌─ Last Week's Summary ──────┐
│ • 2 workouts completed     │
│ • 1 PR                      │
│ • 8,400 lb total volume    │
└────────────────────────────┘

Your week ended yesterday. Check in
to start this week.

┌────────────────────────────┐
│         Check In           │  ← only CTA
└────────────────────────────┘
```

**Interactions:**
- **"Check In"** → navigates to `/check-in`.
- **No "Do Today" actions.** Last week is historically closed. Swaps are impossible.
- **Not dismissible.** This is a hard gate — the user cannot access any workout flow until they check in.

### Trigger Logic (Pseudocode)

```
onLoadWorkoutPage() {
  const today = getTodayIndex(timezone)
  const currentMonday = getCurrentMonday(timezone)
  const plan = getFullPlan(userId, { weekStartDate: currentMonday })

  // Case A: Plan exists for current week
  if (plan) {
    const todayDay = plan.days.find(d => d.day_index === today)
    if (todayDay && todayDay.exercises.length > 0) {
      return State.NORMAL_WORKOUT(todayDay)  // Today has a workout
    }

    const lastTrainingDay = max(settings.training_days)
    if (today > lastTrainingDay) {
      const incompleteWorkouts = findIncompleteWorkouts(plan)
      return State.END_OF_WEEK(plan, incompleteWorkouts)
    }

    return State.REST_DAY(plan)  // Existing rest day state
  }

  // Case B: No plan for current week — calendar rolled over
  const lastPlan = getMostRecentPlan(userId)
  const lastCheckIn = findCheckIn(userId, lastPlan.week_number)
  if (lastPlan && !lastCheckIn) {
    return State.MONDAY_GATE(lastPlan)  // Must check in before proceeding
  }

  // Case C: No plan, no pending check-in — plan is generating or needs generation
  // (existing behavior on /plan page)
}
```

### CTA Wording (Adaptive)

| Scenario | CTA |
|---|---|
| End of week, all workouts resolved | **Check In** |
| End of week, 1+ incomplete workouts | **Skip Remaining & Check In** |
| Monday gate, last week unchecked | **Check In** |

The "Skip Remaining" variant exists because [Nielsen Norman Group, "Button Labels"] and [Brignull, "deceptive patterns"] both argue that CTA labels should make the consequence explicit. Checking in with unresolved workouts *does* skip them — the button should say so.

### What Happens on `/plan`

The Plan page agenda reflects the current plan state including any swaps made via Edit mode or the "Do Today" action. This is already the case — `/api/swap-days` updates `planned_days` rows, and `/plan` renders from the same source.

**Additional addition:** a persistent check-in entry point on `/plan`. Always visible, enabled/disabled based on state:
- **Enabled** when check-in is actionable (State 2 or State 3 conditions apply)
- **Disabled with subtle hint** when the week is still in progress

This provides a secondary path so `/workout` is not the single point of entry for check-in.

## Edge Case Resolution

### Edge Case 1: Athlete with Sunday Training Day
- `training_days` includes 6 (Sunday)
- Sunday has a scheduled workout
- State 1 (normal workout) on Sunday
- State 2 (end of week) does not trigger because today still has a workout
- After Sunday's workout is resolved, check-in would trigger Monday — but Monday is a new calendar week → State 3 (Monday gate) is the correct state
- **Note:** This means Sunday trainers have their check-in "catch-up window" on Monday only, not a multi-day window like Mon-Fri trainers. This is consistent with the calendar rules.

### Edge Case 2: Skipped Monday, Swap to Sunday Before Check-In
- User has Mon-Fri training days
- User skipped Monday, did Thu and Fri
- On Saturday, State 2 triggers (today > max training day, today has no workout)
- Incomplete Monday workout is shown with "Do Today" action
- User taps "Do Today" → swap happens → today (Saturday) now has the Push workout → State 1 on Saturday
- After completing Saturday's work, State 2 re-triggers on Sunday (assuming still no other workouts remain)
- User checks in Sunday → flow complete

### Edge Case 3: Check In, Then Try to Swap to Sunday
- User checks in Saturday, plan marked `completed`
- User tries to swap a workout to Sunday via Edit mode
- **Server blocks the swap** — `/api/swap-days` returns 409 if the plan status is `completed`
- UI should hide Edit mode entry when plan is completed
- User cannot modify the closed plan; new work belongs to the next week

### Edge Case 4: User Ignores Check-In, Monday Arrives
- User finishes Friday's workout, ignores the State 2 prompt on Saturday and Sunday
- Sunday at midnight: calendar rolls over to new week
- Monday morning: no plan exists for the new calendar week (check-in never happened → no generation)
- User opens `/workout` → State 3 (Monday gate)
- User must check in before they can see any workout for the new week
- Check-in triggers generation; once complete, normal flow resumes

### Edge Case 5: User Tries to Check In Early (Before Last Training Day)
- Not addressed by this design. Current behavior: the check-in page loads, user can submit.
- **Recommendation:** out of scope for this fix. Can be addressed separately if it becomes a problem. Users who intentionally check in early are essentially declaring their week complete, which is acceptable.

## Implementation Dependencies

### Server-Side
1. **Trigger logic in `/workout/+page.server.ts`** — determine which state to render based on plan existence, today's position in the week, and pending check-in status.
2. **Server guard on `/api/swap-days`** — reject modifications to plans with status `completed`. Return 409.
3. **Helper query:** "most recent plan without a check-in submitted" — for State 3 detection.

### Client-Side
1. **New page state components** for State 2 (end of week) and State 3 (Monday gate).
2. **Remove banner dismissal logic** for check-in banner (keep dismissal for plan-review, which is legitimately a transient notification).
3. **"Do Today" interaction** — calls existing `/api/swap-days`, re-invalidates.
4. **Persistent check-in link on `/plan`** — context-aware enabled/disabled state.

### Data
- No schema changes required. The calendar-anchored plan structure is already in place.
- No new tables. The `check_ins` table and its relationship to `weekly_plans` already support this design.

## Open Questions (Decide Before Implementation)

1. **How are "incomplete workouts" defined for State 2?**
   - A workout day where any sets remain with status `pending`?
   - A workout day where zero sets have been logged?
   - A workout day where fewer than X% of sets have been completed?
   - **Proposed default:** a workout day is "incomplete" if it has at least one set with status `pending`. Sets marked `skipped` or `completed` count as resolved.

2. **Should the Monday gate (State 3) also appear on `/plan`, or only on `/workout`?**
   - `/plan` currently has an empty state when no plan exists for the current week
   - State 3 is essentially a specialized empty state with a stronger CTA
   - **Proposed:** yes, `/plan` should mirror State 3. The user should see the same gate from either entry point.

3. **What's the max number of "Do Today" actions shown in State 2?**
   - If a user has 4 incomplete workouts, does the list show all 4? Only the most recent?
   - **Proposed:** show all incomplete workouts in order. If this becomes cluttered in practice (>3 incomplete), we revisit.

4. **Persistent check-in link on `/plan` — exact placement and style?**
   - Design decision to be made when implementing.

## References

### Research (Research Findings Report)
- **[F017]** 100% expert consensus on autoregulated training — supports flexibility in catch-up timing
- **[F020]** 77% drop within 3 days without engagement — supports making check-in unmissable
- **[F024]** Flexible weekly goals +20% 90-day retention — supports multi-day catch-up window
- **[F036]** Epley 1RM formula for auto-progression — primary signal, not photos/weight
- **[I002]** Week 1 is make-or-break retention — supports explicit, visible check-in path

### UX Writing
- **Nielsen Norman Group, "Button Labels" (Kara Pernice)** — button text should describe the action's consequence
- **Deceptive Patterns taxonomy (Harry Brignull)** — hiding action consequences is a dark pattern

### Codebase
- `getCurrentMonday()` in `src/lib/utils/date.ts` — calendar week source of truth
- Commit `5564bce` — introduced calendar-anchored plans via `week_start_date`
- `/api/swap-days` — existing swap functionality used by "Do Today" action
