# Exercise Detail — `/exercise/[id]`

> Reference page. Shows exercise instructions, demonstration, and muscle targets.

## Role

Lets athletes learn how to perform an exercise correctly. Accessed by tapping an exercise name on the daily workout view. This is a read-only reference page — no logging or inputs.

## Layout

```
┌─────────────────────────────┐
│ ← Back                      │  ← Header: returns to workout
├─────────────────────────────┤
│                              │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │     Exercise GIF      │  │  ← Animated demo from ExerciseDB
│  │                       │  │
│  └───────────────────────┘  │
│                              │
│  Bench Press                 │  ← Exercise name (display font)
│  Barbell · Chest             │  ← Equipment · target muscle
│  Secondary: Triceps, Delts   │  ← Secondary muscles (muted)
│                              │
├─────────────────────────────┤
│                              │
│  Instructions                │  ← Section header
│                              │
│  1. Lie flat on the bench    │
│     with feet on the floor.  │
│                              │
│  2. Grip the bar slightly    │
│     wider than shoulder      │
│     width.                   │
│                              │
│  3. Unrack and lower the     │
│     bar to mid-chest.        │
│                              │
│  4. Press up to full         │
│     lockout.                 │
│                              │
└─────────────────────────────┘
```

## Design Decisions

### Header
- **Left:** Back arrow — returns to the page that navigated here (daily workout or weekly agenda)
- Keep minimal — the exercise name is in the body, not the header

### Exercise GIF
- Animated GIF from ExerciseDB, displayed prominently at the top
- Full-width within the content area, aspect ratio preserved
- Rounded corners matching card radius (`--radius`)
- Surface background behind GIF as fallback while loading

### Exercise Metadata
- **Name:** Display font, large
- **Equipment + target muscle:** Single line, muted text, separated by ` · `
- **Secondary muscles:** Muted text, listed inline. Only shown if data exists.

### Instructions
- Numbered list with step-by-step text from ExerciseDB
- Body font, normal weight, comfortable line height for readability
- Visual separator (subtle border or spacing) between metadata and instructions

### Data Loading
- Fetch full exercise detail from self-hosted ExerciseDB by `exercise_id` on page load
- The `exercise_id` is stored on `planned_exercises` — passed via the route param
- Lightweight fetch — no plan data needed on this page

## States

| State | Description |
|---|---|
| **Loaded** | GIF, metadata, and instructions all rendered. |
| **Loading** | Skeleton/placeholder while ExerciseDB responds. |
| **Error** | ExerciseDB fetch failed. Show exercise name (from plan data) with "Details unavailable" message. |

## Routing

- `/exercise/[id]` where `[id]` is the ExerciseDB exercise ID
- Back navigation returns to referring page (browser history — no explicit route needed)
- Exercise name on daily workout view becomes a link: `<a href="/exercise/{exercise_id}">`

## Future Considerations (Post-POC)

- [ ] Tabbed navigation: "Info" (current content) + "History" (athlete's logged performance over time)
- [ ] Related exercises or substitution suggestions
- [ ] Video instead of GIF for higher quality demos
