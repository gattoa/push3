# Weekly Agenda — `/plan`

> Sibling view to Today within the Workout tab. Planning and review tool for the full week.
> Last updated: 2026-03-28 (v0.2.0 — segmented tab navigation, avatar, navigation model)

## Role

The weekly agenda lets users see their full week at a glance, review progress across days, and navigate to a specific day's workout. Accessed via the "Week" segment in the header tab switcher (visible on all workout views). Also serves as the destination for the plan review banner — where the user reviews and can edit their new weekly plan.

## Layout

```
┌─────────────────────────────┐
│ [   ]  [ Week | Today ] [AG]│  ← Header: segment control, avatar
│          This Week           │  ← Page title (centered below tabs)
├─────────────────────────────┤
│                              │
│  ┌─ Monday ───────────────┐ │
│  │ Push                    │ │  ← Split label
│  │ 4 exercises · 12 sets  │ │  ← Summary stats
│  │ ████████████ 12/12 ✓   │ │  ← Progress (if started)
│  └─────────────────────────┘ │
│                              │
│  ┌─ Tuesday ──────────────┐ │
│  │ Pull                    │ │
│  │ 4 exercises · 12 sets  │ │
│  │ ████░░░░░░░░ 3/12      │ │
│  └─────────────────────────┘ │
│                              │
│  ┌─ Wednesday ────────────┐ │
│  │ Rest Day                │ │
│  └─────────────────────────┘ │
│                              │
│  ┌─ Thursday ─────────────┐ │
│  │ Legs                    │ │
│  │ 5 exercises · 15 sets  │ │
│  │ ░░░░░░░░░░░░ 0/15      │ │
│  └─────────────────────────┘ │
│                              │
│  ...                         │
└─────────────────────────────┘
```

## Design Decisions

### Header
- **Top bar:** Three-slot layout — left action, center segmented control, right action
- **Left slot:** Empty placeholder (reserved for future Edit button)
- **Center:** Segmented control pill — "Week" (active, mint) and "Today" (inactive). Order reflects overview-to-detail hierarchy. Tapping "Today" navigates to `/workout`.
- **Right:** Avatar with sign-out dropdown. Shows Google OAuth photo or initials (same pattern as daily workout view).
- **Below tabs:** "This Week" page title, centered
- No check-in link in header — check-in is triggered via a contextual banner on the Workout tab (see [daily-workout.md](daily-workout.md) Banner System)
- See [daily-workout.md](daily-workout.md) Navigation Model for the full header spec across all views

### Day Cards (Vertical List)
- Full-width cards in a vertical scroll list
- Each card shows:
  - Day name (display font)
  - Split/muscle group label
  - Exercise count + set count summary
  - Mini progress bar with completion fraction (if any sets logged)
- Rest days: simplified card with "Rest Day" label, no stats
- **Today's card** has an accent border (`--color-accent`) and a "Today" badge pill
- Tapping a card navigates to `/workout/[day]` for that specific day (drill-down view with back arrow)

### Progress Indicators
- Mini progress bar per day card (thinner than the daily view's bar)
- Completed days get a checkmark character
- Color coding: accent green for progress, muted for untouched

### Plan Review Destination
- When the user taps the plan review banner on `/workout`, they land here.
- In plan review context, the agenda shows the newly generated week: training days, splits, exercise counts, and any editable elements.
- No special "review mode" — the agenda itself is the review experience.

### Future: Day Reordering
- Planned but not in initial implementation
- Cards should be designed with drag handles in mind for later addition

## States

| State | Description |
|---|---|
| **Active Week** | Plan exists. All 7 days shown with current progress. |
| **Plan Review** | User arrived via plan review banner. Same layout, but plan is freshly generated with no progress yet. |
| **No Plan** | No active plan. Show empty state or redirect to generation. |

## Open Questions (Deferred — post-POC)

- [ ] Should completed days visually collapse or stay the same size?
- [ ] Tap on today's card — go to `/workout` (parameterless) or `/workout/[day_index]`?
- [ ] Show exercise names in the card preview, or keep it summary-only?
- [ ] Edit button — planned for left slot. Allows reordering days or editing the weekly plan. Header layout reserves an empty placeholder slot for this.

## Routing

- `/plan` loads full plan via `get_full_plan()`, renders all 7 days as vertical list
- Each day card links to `/workout/[day_index]` (drill-down with back arrow → `/plan`)
- Navigation to today via "Today" segment in header tab switcher
- Navigation between `/workout` and `/plan` via segmented control (SvelteKit client-side navigation with crossfade transition)
