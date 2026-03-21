# Weekly Agenda — `/plan`

> Secondary screen. Planning and review tool for the full week.

## Role

The weekly agenda lets users see their full week at a glance, review progress across days, and navigate to a specific day's workout. Accessed from the daily workout view via a list icon.

## Layout

```
┌─────────────────────────────┐
│ ← Today        This Week    │  ← Header
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
- **Left:** "← Today" — returns to `/workout` (today's view)
- **Center:** "This Week" label (no week number — it's internal, not user-facing)
- **Right:** "Check-In →" link — accent-colored, navigates to `/check-in`

### Day Cards (Vertical List)
- Full-width cards in a vertical scroll list
- Each card shows:
  - Day name (display font)
  - Split/muscle group label
  - Exercise count + set count summary
  - Mini progress bar with completion fraction (if any sets logged)
- Rest days: simplified card with "Rest Day" label, no stats
- **Today's card** should have a visual indicator (accent border or subtle highlight)
- Tapping a card navigates to `/workout/[day]` for that specific day

### Progress Indicators
- Mini progress bar per day card (thinner than the daily view's bar)
- Completed days get a checkmark icon
- Color coding: accent green for progress, muted for untouched

### Future: Day Reordering
- Planned but not in initial implementation
- Cards should be designed with drag handles in mind for later addition

## States

| State | Description |
|---|---|
| **Active Week** | Plan exists. All 7 days shown with current progress. |
| **No Plan** | No active plan. Show empty state or redirect to generation. |

## Open Questions (Deferred — post-POC)

- [ ] Should completed days visually collapse or stay the same size?
- [ ] Tap on today's card — go to `/workout` (parameterless) or `/workout/[day_index]`?
- [ ] Show exercise names in the card preview, or keep it summary-only?

## Routing

- `/plan` loads full plan via `get_full_plan()`, renders all 7 days as vertical list
- Each day card links to `/workout/[day_index]`
- Header back link goes to `/workout` (today)
