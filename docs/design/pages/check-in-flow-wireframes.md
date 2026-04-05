# Check-In Flow — Wireframes

> Companion to `check-in-flow.md`. ASCII wireframes for each state on `/workout`.
>
> **Color conventions** (matching existing design system):
> - `--color-reflect` (lavender) — check-in, reflection
> - `--color-activity` (mint) — primary workout states
> - `--color-celebrate` (gold) — completion, PRs
> - `--color-border` / muted tones — inactive states

---

## State 1: Normal Workout Flow (Existing, For Reference)

**Trigger:** Today has a scheduled workout with pending sets.

```
┌───────────────────────────────────┐
│  [   ]    [ Week | Today ]   [AG] │  ← header: segmented nav, avatar
│         Saturday, Apr 5           │  ← day + date
│              Push                 │  ← split label
├───────────────────────────────────┤
│ ██████░░░░░░░░  3/12               │  ← progress bar
├───────────────────────────────────┤
│                                    │
│  ┌─ 1. Barbell Bench Press ───┐  │
│  │ ✓ Completed · 3/3 sets      │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─ 2. Incline DB Press ──────┐  │  ← active, expanded
│  │ 2  Incline DB Press        │  │
│  │ ↗ Last: 50 lb × 10          │  │
│  │ [set rows with inputs]     │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─ 3. Cable Fly ──────────────┐  │
│  │ Upcoming                    │  │
│  └─────────────────────────────┘  │
└───────────────────────────────────┘
```

No change. This is the existing design.

---

## State 2: End-of-Week Check-In

**Trigger:** Today has no actionable work (either no workout today, or today's workout is fully resolved) AND today >= max(training_days). Also covers the "calendar rolled over, no check-in yet" case — the UI is the same whether the user is still in the plan's week or has crossed into a new calendar week. The system determines which plan's summary to show; the user sees one consistent state.

### Default layout — all workouts resolved

```
┌───────────────────────────────────┐
│  [   ]    [ Week | Today ]   [AG] │
│          Saturday, Apr 5          │
├───────────────────────────────────┤
│                                    │
│  ┌─ Your Week ────────────────┐   │
│  │ ██████████████████████████  │   │  ← full bar (mint + gold)
│  │                             │   │
│  │ 5 workouts · 🏆 2 PRs       │   │
│  │ 🔥 12,400 lb volume         │   │
│  └─────────────────────────────┘   │
│                                    │
│  ┌─────────────────────────────┐  │
│  │       Check In              │  │  ← lavender CTA
│  └─────────────────────────────┘  │
│                                    │
└───────────────────────────────────┘
```

### Variant — incomplete workouts present

```
┌───────────────────────────────────┐
│  [   ]    [ Week | Today ]   [AG] │
│          Saturday, Apr 5          │
├───────────────────────────────────┤
│                                    │
│  ┌─ Your Week ────────────────┐   │
│  │ ████████░░░░░░░░░░░░        │   │  ← partial progress
│  │                             │   │
│  │ 2 of 4 workouts · 🏆 1 PR   │   │
│  │ 🔥 6,200 lb volume          │   │
│  └─────────────────────────────┘   │
│                                    │
│  Still on your plan                │  ← section label
│                                    │
│  ┌─────────────────────────────┐  │
│  │ Monday — Push               │  │
│  │ 5 exercises · 15 sets       │  │
│  │                 Do Today →  │  │  ← swap-to-today action
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │ Tuesday — Pull              │  │
│  │ 4 exercises · 12 sets       │  │
│  │                 Do Today →  │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │  Skip Remaining & Check In  │  │  ← adaptive CTA
│  └─────────────────────────────┘  │
│                                    │
└───────────────────────────────────┘
```

**Notes:**
- No sub-header under the date — the summary card's stats speak for themselves
- No "Your training week" / "Your week ends today" / "Your week ended yesterday" framing
- The summary card is the content; the CTA is the action
- `Still on your plan` section only appears when there are incomplete workouts
- CTA is adaptive: `Check In` when all work is resolved, `Skip Remaining & Check In` when incomplete workouts exist
- Same UI on Sunday, same UI on Monday morning before check-in. The system routes to the right data; the user sees the same pattern.
- Not dismissible, no expiry

---

## State Transitions

```
                  ┌─────────────────┐
                  │   State 1       │
                  │ Normal Workout  │
                  └────────┬────────┘
                           │
                  (all sets resolved
                   AND today >= max(training_days))
                           │
                           ▼
            ┌──────────────────────────┐
            │        State 2           │
            │   End-of-Week Check-In   │
            └──────┬────────────┬──────┘
                   │            │
            ("Do Today")   ("Check In")
                   │            │
                   ▼            ▼
              State 1         /check-in
                                 │
                                 ▼
                          [plan generates]
                                 │
                                 ▼
                             State 1
                          (new week)
```

If the calendar rolls over before the user acts, they still land in State 2 — the system just references the most recent unchecked plan instead of the current week's plan. Once check-in is submitted, generation kicks off for the current calendar week.

---

## Open Questions (Not Blocking)

1. **What does `/plan` show during State 2?** Current thinking: mirror the state. Same summary + CTA. Open for refinement when implementing.
2. **Zero-workout weeks.** Edge case of extreme non-engagement. Summary still shows honestly (`0 workouts · 0 volume`), CTA still leads to check-in. No guilt-trip copy.
3. **Animation between State 1 and State 2.** Implementation detail — decide when building.
