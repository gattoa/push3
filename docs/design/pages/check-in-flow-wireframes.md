# Check-In Flow — Wireframes

> Companion to `check-in-flow.md`. ASCII wireframes for each state on `/workout`.
>
> **Color conventions** (matching existing design system):
> - `--color-reflect` (lavender) — check-in, reflection, week wrap-up
> - `--color-activity` (mint) — primary CTAs, active workout
> - `--color-celebrate` (gold) — completion, PRs, achievements
> - `--color-danger` (rose) — skip, destructive
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

## State 2a: End-of-Week (All Workouts Resolved)

**Trigger:** Today >= max(training_days). Today has no pending work (either no workout today, or today's workout is fully resolved). All training days this week are resolved (completed or skipped). No incomplete workouts to catch up.

**Example scenario:** Mon-Fri trainer, completed all 5 workouts. Today is Saturday.

```
┌───────────────────────────────────┐
│  [   ]    [ Week | Today ]   [AG] │  ← same header as State 1
│          Saturday, Apr 5          │
│       Your training week          │  ← lavender sub-header
├───────────────────────────────────┤
│                                    │
│  ┌─ Your Week ────────────────┐   │
│  │ ◉✓ Week Complete            │   │  ← lavender ring + check
│  │                             │   │
│  │ ██████████████████████████  │   │  ← segmented bar (mint + gold)
│  │                             │   │
│  │ 5 workouts · 🏆 2 PRs       │   │  ← summary stats
│  │ 🔥 12,400 lb total volume   │   │
│  └─────────────────────────────┘   │
│                                    │
│  You wrapped up every workout.     │  ← supporting text
│  Check in to set up next week.     │
│                                    │
│  ┌─────────────────────────────┐  │
│  │       Check In              │  │  ← primary CTA, lavender
│  └─────────────────────────────┘  │
│                                    │
└───────────────────────────────────┘
```

**Notes:**
- Lavender theme throughout (check-in = reflect moment)
- Celebratory in tone — "you did it, now wrap up"
- Single clear action: Check In
- Not dismissible, no X button

---

## State 2b: End-of-Week (Incomplete Workouts Remain)

**Trigger:** Same as 2a, but one or more workouts still have pending sets (skipped-mid-week or never started).

**Example scenario:** Mon/Tue/Thu/Fri trainer. Skipped Monday and Tuesday. Completed Thursday and Friday. Today is Saturday.

```
┌───────────────────────────────────┐
│  [   ]    [ Week | Today ]   [AG] │
│          Saturday, Apr 5          │
│       Your training week          │
├───────────────────────────────────┤
│                                    │
│  ┌─ Your Week ────────────────┐   │
│  │ Week in progress            │   │
│  │                             │   │
│  │ ████████░░░░░░░░░░░░        │   │  ← partial progress
│  │                             │   │
│  │ 2 of 4 workouts · 🏆 1 PR   │   │
│  │ 🔥 6,200 lb volume          │   │
│  └─────────────────────────────┘   │
│                                    │
│  Still on your plan                │  ← section header
│                                    │
│  ┌─────────────────────────────┐  │
│  │ Monday — Push               │  │  ← card for incomplete day
│  │ 5 exercises · 15 sets       │  │
│  │                 Do Today →  │  │  ← action: swap to today
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │ Tuesday — Pull              │  │
│  │ 4 exercises · 12 sets       │  │
│  │                 Do Today →  │  │
│  └─────────────────────────────┘  │
│                                    │
│  ─────────── or ───────────        │
│                                    │
│  ┌─────────────────────────────┐  │
│  │  Skip Remaining & Check In  │  │  ← primary CTA, adaptive text
│  └─────────────────────────────┘  │
│                                    │
└───────────────────────────────────┘
```

**Notes:**
- Header copy is neutral — "Week in progress" not "Week Complete"
- Progress bar shows actual completion (not filled)
- "Still on your plan" section lists every day with pending sets
- Each card has a clear action: "Do Today" → swap that day with today
- **CTA changes** based on presence of incomplete work: "Skip Remaining & Check In" (explicit about consequence)
- Visual divider ("or") between catch-up actions and check-in CTA — gives the user a clear choice
- Tapping "Do Today" transitions back to State 1 with the swapped workout

---

## State 2c: Sunday Variant

**Trigger:** Same as 2a or 2b, but today is Sunday (the last possible day of the calendar week).

**Example scenario:** Same as 2a, but it's Sunday now, not Saturday. The calendar rolls over at midnight.

```
┌───────────────────────────────────┐
│  [   ]    [ Week | Today ]   [AG] │
│           Sunday, Apr 6           │
│       Your week ends today        │  ← stronger header copy
├───────────────────────────────────┤
│                                    │
│  ┌─ Your Week ────────────────┐   │
│  │ ◉✓ Week Complete            │   │
│  │                             │   │
│  │ ██████████████████████████  │   │
│  │                             │   │
│  │ 5 workouts · 🏆 2 PRs       │   │
│  │ 🔥 12,400 lb total volume   │   │
│  └─────────────────────────────┘   │
│                                    │
│  Tomorrow starts a new week.       │  ← acknowledge hard boundary
│  Check in to generate your plan.   │
│                                    │
│  ┌─────────────────────────────┐  │
│  │       Check In              │  │
│  └─────────────────────────────┘  │
│                                    │
└───────────────────────────────────┘
```

**Notes:**
- Only two changes from 2a: header copy ("Your week ends today") and supporting text ("Tomorrow starts a new week")
- Functionally identical — same CTA, same interactions, same layout
- The copy change acknowledges the hard calendar boundary without being alarming
- If there are incomplete workouts on Sunday (e.g., 2b scenario on Sunday), the same structure applies with the "Still on your plan" section present

---

## State 3: Monday Gate (Calendar Rolled, No Check-In Yet)

**Trigger:** Calendar has rolled to a new week. No plan exists for the current calendar week. The most recent plan (last week's) has no submitted check-in.

**Example scenario:** User finished last week but didn't check in by Sunday night. Today is Monday.

```
┌───────────────────────────────────┐
│  [   ]    [ Week | Today ]   [AG] │
│           Monday, Apr 7           │
│        Check in to start          │  ← strong directive
│           this week               │
├───────────────────────────────────┤
│                                    │
│  Your week ended yesterday.        │  ← explains the gate
│  Check in to generate this         │
│  week's plan.                      │
│                                    │
│  ┌─ Last Week ────────────────┐   │
│  │ Week 4 Summary              │   │
│  │                             │   │
│  │ █████████████████░░░░░      │   │
│  │                             │   │
│  │ 4 of 5 workouts · 🏆 2 PRs  │   │
│  │ 🔥 10,800 lb volume         │   │
│  └─────────────────────────────┘   │
│                                    │
│  ┌─────────────────────────────┐  │
│  │         Check In            │  │  ← the ONLY action
│  └─────────────────────────────┘  │
│                                    │
└───────────────────────────────────┘
```

**Notes:**
- No "Do Today" actions — last week is historically closed
- Last week's summary is shown as a read-only historical record (not "your week" — "last week")
- Supporting copy explains the gate: "Your week ended yesterday"
- Single CTA: Check In
- This is functionally a hard gate — the user cannot access any workout flow until they check in
- Once they tap Check In → goes to `/check-in` → on submit, plan generates → normal flow resumes

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
              │  (2a / 2b / 2c variants) │
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
                          Back to State 1
                          (new week)

───────────────── midnight boundary ─────────────────

              ┌──────────────────────────┐
              │        State 3           │
              │     Monday Gate          │
              │ (no check-in for last    │
              │       week yet)          │
              └──────────┬───────────────┘
                         │
                    ("Check In")
                         │
                         ▼
                     /check-in
                         │
                         ▼
                  [plan generates]
                         │
                         ▼
                     State 1
                  (new week)
```

---

## What's NOT Covered (Open for Discussion)

1. **What does `/plan` show during State 2 and State 3?** The current thinking is `/plan` mirrors the state — same weekly summary, same CTA. But that's an open decision.

2. **Exact microcopy.** "Your training week," "Tomorrow starts a new week," "Your week ended yesterday" — these are first drafts. Can be tightened.

3. **Icon/visual treatment.** The lavender ring + check glyph (`◉✓`) is shorthand for whatever completion icon makes sense. Could be the existing Lucide `ClipboardCheck` icon, could be something new.

4. **What if the user has zero completed workouts?** Edge case of extreme non-engagement. Probably still show State 2 with "0 workouts · 0 volume" — honest but not celebratory. Supporting copy should still be neutral ("You skipped this week. Check in to start fresh.") rather than guilt-trippy.

5. **Animation/transition between states.** Does State 1 → State 2 after workout completion animate smoothly? Fade? Slide? Out of scope for this doc — implementation detail.
