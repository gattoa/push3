# Daily Workout — `/workout`

> Primary screen. What users see every time they open the app.

## Role

This is the app's home screen post-onboarding. It shows today's prescribed workout and lets users log sets immediately. The goal is zero taps between opening the app and seeing what to do.

## Layout

```
┌─────────────────────────────┐
│ [≡]    Monday, Mar 20       │  ← Header: date
│              Push Day        │  ← Workout/split name
├─────────────────────────────┤
│ ████████░░░░░░  4/12 sets   │  ← Progress bar
├─────────────────────────────┤
│                              │
│  ┌─ Exercise 1 ───────────┐ │
│  │ Exercise Name           │ │
│  │ Notes (if any)          │ │
│  │                         │ │
│  │ Set  Target  Wt  Reps ○│ │  ← Set rows with inputs
│  │  1   8×135  [  ] [  ] ○│ │
│  │  2   8×135  [  ] [  ] ○│ │
│  │  3   8×135  [  ] [  ] ○│ │
│  └─────────────────────────┘ │
│                              │
│  ┌─ Exercise 2 ───────────┐ │
│  │ ...                     │ │
│  └─────────────────────────┘ │
│                              │
│  ┌─ Summary ──────────────┐ │  ← Appears when all sets done
│  │ 12 completed · 0 skip  │ │
│  │ 8,400 lb total volume  │ │
│  └─────────────────────────┘ │
└─────────────────────────────┘
```

## Design Decisions

### Header
- **Left:** List icon — navigates to weekly agenda (`/plan`)
- **Right:** Day + date (e.g., "Monday, Mar 20"), workout/split name below (e.g., "Push Day")
- No week number — it's an internal concept, not user-facing
- No back button — this is home

### Today Detection
- Map current day of week (Mon=0 … Sun=6) to the matching `planned_day.day_index`
- If today is a rest day: show rest day state (design deferred)

### Progress Bar
- Same pattern as existing workout view: completed + skipped sets / total sets
- Accent green fill, smooth transition on update

### Exercise Cards
- Carry forward existing design from `/workout/[day]`
- Numbered badge, exercise name (display font), optional notes
- Set rows with target, weight input, reps input, complete/skip actions

### Set Logging
- Identical behavior to current `/workout/[day]`: immediate save via `/api/log-set`
- Complete (✓) and skip (✗) buttons, mutually exclusive
- Inputs disabled when set is skipped

### Completion Summary
- Appears when all sets have a status (completed or skipped)
- Shows: completed count, skipped count, total volume
- Two action buttons: "View Weekly Plan" (secondary, → `/plan`) and "Weekly Check-In" (primary, → `/check-in`)

## States

| State | Description |
|---|---|
| **Fresh** | No sets logged today. All inputs empty, no status icons active. |
| **In Progress** | Some sets logged. Progress bar partially filled. |
| **Complete** | All sets have status. Summary card visible. |
| **Rest Day** | Today has no exercises. Rest day card shown. (Design deferred) |
| **No Plan** | User has no active plan. Redirect to generation or show empty state. |

## Open Questions (Deferred — post-POC)

- [x] ~~Should the header show a greeting or time-of-day context?~~ — No. Show date + workout name instead.
- [ ] Exercise card expand/collapse — all open by default, or collapse completed ones?
- [ ] Pull-to-refresh behavior?

## Routing Changes

- Auth guard (`hooks.server.ts`) redirects authenticated + onboarded users to `/workout` instead of `/plan`
- `/workout` (no `[day]` param) resolves today's day index server-side
- `/workout/[day]` still works for viewing specific days (linked from weekly agenda)
