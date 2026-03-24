# Daily Workout — `/workout`

> Primary screen. What users see every time they open the app. Lives within the Workout tab of the persistent two-tab bottom nav.
> Last updated: 2026-03-24 (v0.3.0 — progressive disclosure, arc gauges, segmented progress, set interaction model, color semantics applied)

## Role

This is the app's home screen post-onboarding. It shows today's prescribed workout and lets users log sets immediately. The goal is zero taps between opening the app and seeing what to do. Contextual banners (plan review, check-in) appear above the content area when triggered by the weekly cycle.

## Layout

```
┌─────────────────────────────────┐
│ [≡]    Monday, Mar 24      [AG] │  ← Header: list icon (→/plan), date, avatar
│              Push                │  ← Split label
├─────────────────────────────────┤
│ ┌─ Banner (conditional) ──── ×┐ │  ← Lavender (check-in) or mint (plan review)
│ │ 📋 Time for your check-in → │ │     See Banner System
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ██████████░░░░░░░░░  6/9        │  ← Segmented progress bar (per-set, colored)
├─────────────────────────────────┤
│                                  │
│  ┌─ Exercise 1 (completed) ──┐  │  ← Dimmed, collapsed, check badge
│  │ ✓  Barbell Bench Press     │  │     Gold badge if exercise had PR
│  │    ⭐ New PR        ◠ 3/3 ▾│  │     Arc gauge shows completion
│  └───────────────────────────┘  │
│                                  │
│  ┌─ Exercise 2 (active) ─────┐  │  ← Expanded, mint glow border
│  │ 2  Incline Dumbbell Press  │  │
│  │    ↗ Last: 50 lb × 10     │  │
│  │    Slow eccentric, 3s down │  │  ← Notes (only when expanded)
│  │ ┌───────────────────────┐  │  │
│  │ │ 1  50 lb × 12  🏆PR  ✓│  │  │  ← Completed set with PR
│  │ │ 2  50 lb × 10        ✓│  │  │  ← Completed set
│  │ │ 3  [50] lb × [12]  × ✓│  │  │  ← Pending: inputs visible
│  │ └───────────────────────┘  │  │
│  └───────────────────────────┘  │
│                                  │
│  ┌─ Exercise 3 (upcoming) ───┐  │  ← Default opacity, collapsed
│  │ 3  Cable Fly               │  │
│  │    🏋 First time    ◠ 1/3 ▾│  │     Red arc sliver for skip
│  └───────────────────────────┘  │
│                                  │
│  ┌─ Completion Summary ──────┐  │  ← Only when all sets resolved
│  │    ◉ ✓                     │  │     Gold ring + check
│  │  Workout Complete          │  │     Celebrate (gold) theme
│  │  7 Done · 2 Skip · 8,400  │  │
│  │  [View Weekly Plan]        │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  [ Workout ]    [ Progress ]    │  ← Persistent bottom nav
└─────────────────────────────────┘
```

## Design Decisions

### Header
- **Left:** List icon (Lucide `Menu`) — navigates to weekly agenda (`/plan`). Secondary view within the Workout tab, not a separate nav destination.
- **Center:** Day + date (e.g., "Monday, Mar 24"), split label below (e.g., "Push")
- **Right:** Avatar with sign-out dropdown. Shows user photo or initials.
- No week number — internal concept, not user-facing
- No back button — this is home

### Banner System
- A single banner slot sits above the progress bar. At most one banner at a time.
- **Check-in banner:** Appears when check-in day arrives (Sunday). Lavender theme (`--color-reflect-muted` background). Lucide `ClipboardCheck` icon. Navigates to `/check-in`.
- **Plan review banner:** Appears after new plan generation (< 48hrs old, week > 1). Mint theme (`--color-activity-muted` background). Lucide `Eye` icon. Navigates to `/plan`.
- **Priority:** Check-in takes precedence over plan review.
- **Persistence:** Dismiss via × button. Dismissed state stored in localStorage with 48hr expiry.
- **Visual:** Distinct from exercise cards — uses `--radius-sm`, subtle glow shadow, no card border weight. Should read as a system notification, not content.

### Segmented Progress Bar
- One segment per set, ordered by exercise sequence then set number.
- **Segment colors** (per brand guidelines):
  - **Mint** (`--color-activity`) — completed set that met prescription
  - **Gold** (`--color-celebrate`) — completed set that is a PR
  - **Rose** (`--color-danger`) — skipped set
  - **Grey** (`--color-border`) — pending set
- Segments use light-to-dark gradients for momentum feel.
- Shows `{completed + skipped}/{total}` label in mono font.
- **Hidden when all sets resolved** — replaced by completion summary.

### Exercise Cards — Progressive Disclosure

Exercise cards use an **accordion pattern**: only the active exercise is expanded by default. Completed exercises collapse and dim. Upcoming exercises collapse at reduced opacity.

#### Exercise States

| State | Visual Treatment | Badge | Expanded |
|---|---|---|---|
| **Completed** | Dimmed (`--opacity-muted`), no shadow | Grey check (or gold check if PR) | No (collapsed) |
| **Active** | Full opacity, mint border (`--color-activity`), glow shadow | Number in mint circle | Yes (auto-expanded) |
| **Upcoming** | Reduced opacity (0.6), no shadow | Number in mint circle | No (collapsed) |

- Tapping any card header toggles expand/collapse.
- "Active" = first exercise in order that has pending sets.

#### Card Header (always visible)
- **Number badge:** 26px circle. Mint background when active/upcoming. Grey with check icon when completed. Gold with check icon when completed with PR.
- **Exercise name:** Manrope semibold, capitalize. Links to `/exercise/[id]` (tap stops propagation from accordion toggle).
- **History line:** Below name. Three variants:
  - `↗ Last: {weight} {unit} × {reps}` — when historical data exists (Lucide `TrendingUp`, mono font, tertiary color)
  - `🏋 First time` — when no history exists (Lucide `Dumbbell`, mint italic)
  - `⭐ New PR` — when completed exercise had a PR set (Lucide `Trophy`, celebrate gold, bold)
- **Arc gauge:** 48×28px SVG semi-ring showing exercise completion. Stacked layers (bottom to top): danger (skips), activity (completed), celebrate (PRs). Label: `{done}/{total}` in mono font.
- **Chevron:** Rotates 180° when expanded.

#### Card Body (only when expanded)
- **Notes:** Italic, tertiary color. Below header, above sets.
- **Set rows:** See Set Interaction section.

### Set Interaction

Each set row shows in one of three states:

#### Pending State
- Set number (mono, tertiary) | Weight input + unit label + × + Reps input | Skip (×) + Confirm (✓) buttons
- Inputs show placeholder values from the prescribed target (not pre-filled — user must actively enter or accept)
- Input borders highlight mint on focus
- **Confirm (✓):** Logs the set with entered values. If no values entered, logs with prescribed target values (auto-fill on confirm).
- **Skip (×):** Small, muted, left of confirm button. Opacity 0.6 by default, turns rose on hover.

#### Completed State
- Set number | `{weight} {unit}  ×  {reps}` + optional PR badge | Disabled skip (×) + Active undo (✓)
- **Weight display:** `{weight}` bold + `{unit}` small tertiary + `×` tertiary with `--space-2` margins + `{reps}` medium
- **PR badge:** Gold pill — Lucide `Trophy` (10px) + "PR" text. `--color-celebrate` on `--color-celebrate-muted`. Appears inline after the logged values.
- **Row background:** `--color-activity-subtle` tint
- **Undo:** Tap ✓ again to return to pending state.

#### Skipped State
- Set number | ~~target values~~ struck-through + "SKIPPED" chip | Active undo (×) + Disabled confirm (✓)
- **Struck-through target:** Original prescription with `text-decoration: line-through` in tertiary color
- **Skip chip:** Rose pill badge — "SKIPPED" text in `--color-danger` on `--color-danger-muted`
- **× button:** Turns rose (`--color-danger`), stays in left slot position — no layout shift
- **✓ button:** Dims to 0.3 opacity, pointer-events none
- **Undo:** Tap × again to return to pending state.

#### Button Layout
- **Fixed two-slot layout** to prevent layout shift: `[× skip] [✓ confirm]`
- Skip button: 26×26px, transparent border, muted
- Confirm button: 34×34px, visible border
- When a set is completed/skipped, the inactive button dims but stays in position

### PR Detection
- **Formula:** Epley estimated 1RM = `weight × (1 + reps / 30)`
- **Comparison:** Current set's E1RM vs. historical best E1RM for that exercise (from prior weeks)
- **Week 1:** No PR detection possible (no historical baseline). `bestE1RM` is null, comparison returns false.
- **Display:** PR badge on the set row + gold badge/label on the collapsed exercise card header

### Exercise Swaps (deferred — Phase 8)
- **Trigger:** Swipe left on an exercise card to initiate a swap.
- **Expansion:** Card expands inline showing 3 alternative exercises as compact rows (name + equipment tag).
- **Data source:** Alternatives pre-generated by AI during plan generation. Stored in `planned_exercises.alternatives` (JSON array).
- **Fallback:** ExerciseDB query (same target muscle + user's equipment − current day's exercises).
- See Phase 8 in ROADMAP.md for full scope.

### Completion Summary
- Appears when **all sets have a status** (no pending). Replaces the progress bar.
- **Theme:** Celebrate (gold) — completing a workout is an achievement.
- **Progress ring:** 48×48px SVG circle, gold stroke, gold check icon centered.
- **Title:** "Workout Complete" in `--color-celebrate`, display font bold.
- **Stats row:** Done (mint) · Skipped (rose) · Volume with Flame icon · PRs with Trophy icon (gold, conditional)
- **CTA:** "View Weekly Plan" secondary button → `/plan`
- **Shadow:** Subtle gold glow (`rgba(232, 185, 49, 0.06)`)

### Today Detection
- Map current day of week (Mon=0 … Sun=6) to the matching `planned_day.day_index`
- If today is a rest day: show rest day state (see States section)

## States

| State | Description |
|---|---|
| **Fresh** | No sets logged today. Active exercise expanded, all inputs show placeholders. |
| **In Progress** | Some sets logged. Completed exercises collapse and dim. Active exercise expanded. Segmented progress bar reflects set outcomes. |
| **Complete** | All sets have status. Summary card visible. Progress bar hidden. All exercise cards collapsed and dimmed. |
| **Rest Day** | Today has no exercises. Shows: (1) week-so-far summary (days trained, sets completed, completion %), and (2) next training day preview with full exercise list — read-only, muted styling, labeled "Up Next — [Day]." Exercise names link to `/exercise/[id]`. |
| **Rest Day (Week 1 Cold Start)** | No workouts logged yet. Motivational welcome message. |
| **Cold Start (Week 1)** | No "Last" reference line — shows "First time" with Dumbbell icon. No target weights (by design — no baseline exists). No PR detection. |
| **No Plan** | User has no active plan. Redirect to `/plan/generate`. |

## Data Requirements

### Server Load (`+page.server.ts`)
- `getFullPlan()` RPC → filter to today's `day_index`
- `user_settings.unit_pref` for display
- **Exercise history:** For each exercise in today's plan, fetch `last_weight`, `last_reps`, and `best_e1rm` from prior weeks' `set_logs`. Parallelized with settings query via `Promise.all`.
- **Banner logic:** Check if today is check-in day (Sunday) + no existing check-in for current week. Check if plan was generated < 48hrs ago + week > 1.

### Client State
- `setStates` — reactive record keyed by `planned_set_id` with `{ weight, reps, status, saving, logId }`
- `expandedExercise` — which exercise card is expanded (auto-set to first exercise with pending sets)
- `bannerDismissed` — dismiss state (backed by localStorage)
- Derived: `totalSets`, `completedSets`, `skippedSets`, `totalVolume`, `allDone`, `prCount`, `segments`

## Open Questions (Deferred)

- [x] ~~Should the header show a greeting or time-of-day context?~~ — No. Show date + workout name.
- [x] ~~Exercise card expand/collapse — all open by default, or collapse completed ones?~~ — Progressive disclosure: only active exercise expanded. Completed collapse and dim. Upcoming collapse at reduced opacity.
- [ ] Pull-to-refresh behavior?
- [ ] Rest timer between sets?

## Routing

- Auth guard (`hooks.server.ts`) redirects authenticated + onboarded users to `/workout`
- `/workout` (no `[day]` param) resolves today's day index server-side
- `/workout/[day]` still works for viewing specific days (linked from weekly agenda)
