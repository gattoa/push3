# Daily Workout — `/workout`

> Primary screen. What users see every time they open the app. Lives within the Workout tab of the persistent two-tab bottom nav.
> Last updated: 2026-03-28 (v0.4.0 — segmented tab navigation, [day] drill-down header, navigation model)

## Role

This is the app's home screen post-onboarding. It shows today's prescribed workout and lets users log sets immediately. The goal is zero taps between opening the app and seeing what to do. Contextual banners (plan review, check-in) appear above the content area when triggered by the weekly cycle.

## Layout

```
┌─────────────────────────────────┐
│ [   ]  [ Week | Today ]   [AG] │  ← Header: segment control, avatar
│          Monday, Mar 24         │  ← Day + date (centered below tabs)
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
│  ┌─ Completion Summary ──────┐  │  ← Replaces progress bar when all sets resolved
│  │ ◉✓ Workout Complete       │  │     Inline gold ring + gold title
│  │ ██████████████████████████│  │     Full progress bar (mint/gold/rose segments)
│  │ 7 Done · 🏆 1 PR · 🔥8400│  │     Compact inline stats
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  [ Workout ]    [ Progress ]    │  ← Bottom nav (planned, currently hidden)
└─────────────────────────────────┘
```

## Design Decisions

### Header
- **Top bar:** Three-slot layout — left action, center segmented control, right action
- **Left slot:** Empty placeholder (reserved for future Edit button)
- **Center:** Segmented control pill — "Week" (inactive) and "Today" (active, mint). Order reflects overview-to-detail hierarchy. Tapping "Week" navigates to `/plan`.
- **Right:** Avatar with sign-out dropdown. Shows Google OAuth photo or initials.
- **Below tabs:** Day + date (e.g., "Monday, Mar 24") and split label (e.g., "Push"), centered
- No week number — internal concept, not user-facing
- No back button — this is home

### `/workout/[day]` Header (Drill-Down Variant)
When viewing a specific day via the weekly agenda:
- **Left slot:** Back arrow (Lucide `ArrowLeft`, icon-only) → navigates to `/plan`
- **Center:** Segmented control with "Week" active (you're viewing a day within the week context)
- **Right slot:** Empty placeholder (reserved for future Edit button)
- **Below tabs:** Day name and split label, centered
- The segmented control persists on drill-down for quick lateral navigation (tap "Today" to jump to today's workout)

### Navigation Model
| View | Left | Center | Right | Below |
|---|---|---|---|---|
| `/workout` | *empty (Edit planned)* | Week · **[Today]** | Avatar | Day + date, split |
| `/plan` | *empty (Edit planned)* | **[Week]** · Today | Avatar | "This Week" |
| `/workout/[day]` | ← Back → `/plan` | **[Week]** · Today | *empty (Edit planned)* | Day name, split |

- Segmented "Today" always → `/workout`
- Segmented "Week" always → `/plan`
- Bottom nav "Workout" tab always → `/workout` (today)
- Back arrow on `[day]` → `/plan` (return to week overview)

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
| **Active** | Full opacity, subtle mint glow shadow (no colored border) | Number in mint circle | Yes (auto-expanded) |
| **Upcoming** | Reduced opacity (0.6), no shadow | Number in neutral circle (`--color-text-secondary` on `--color-border`) | No (collapsed) |

- Tapping any card header toggles expand/collapse.
- "Active" = first exercise in order that has pending sets.

#### Card Header (always visible)
- **Number badge:** 26px circle. Mint background when active. Neutral (`--color-text-secondary` on `--color-border`) when upcoming. Grey with check icon when completed. Gold with check icon when completed with PR.
- **Exercise name:** Manrope semibold, capitalize. Links to `/exercise/[id]` only when expanded (tap stops propagation from accordion toggle). When collapsed, the name is plain text — the entire header acts as a single expand target with no competing tap targets.
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

All three set states use the **same unified layout** — a single row structure with inline inputs that adapt visually per state. This ensures perfect alignment across pending, completed, and skipped rows and eliminates layout shift on state transitions.

#### Unified Row Structure
```
[set-num] [input-wrap: value + unit] [×] [input-wrap: reps] [badges?] [skip btn] [confirm btn]
```
- The input-wrap groups the numeric input and its unit label ("lb") into a single visual unit.
- Inputs are always present in the DOM. State changes toggle `readonly`, styling, and opacity — not markup structure.

#### Visual Hierarchy — Athlete Focus
The pending set is the athlete's next action. Everything else should recede.

| State | Row Opacity | Text Color | Text Weight | Background | Rationale |
|---|---|---|---|---|---|
| **Pending** | 1.0 | `--color-text` | `medium` | Default (`--color-bg-raised`) | **Primary focus.** This is what the athlete needs to do next. |
| **Completed** | 0.55 | `--color-text-secondary` | `medium` | Default (`--color-bg-raised`) | **Recedes.** Done — quiet confirmation, doesn't compete for attention. |
| **Skipped** | 1.0 | `--color-text-tertiary` | `medium` | Default (`--color-bg-raised`) | Struck-through values + rose "Skipped" chip. Data point, not judgment. |

#### "Text Until Tapped" Input Pattern
Inputs appear as **plain inline text** at rest — no visible borders or backgrounds. On tap/focus, they reveal themselves as editable fields with a mint border and background. This reduces visual noise and follows the pattern validated by Strong and Hevy ([F004]: "2–3 tap quick-complete" with large thumb-friendly targets).

**Resting state:**
- `border: transparent`, `background: transparent`
- Placeholder values shown in `--color-text` (pending) — the prescribed target
- Input + unit label grouped in a wrapper (`set-input-wrap`) with `inline-flex` + `align-items: baseline`

**Focused state (`:focus-within` on wrapper):**
- `border-color: var(--color-activity)`, `background: var(--color-bg)`
- The wrapper gains the border, encompassing both the value and unit label as one field
- Text centers within the field for data entry

**Completed/readonly state:**
- Same wrapper layout, `readonly` attribute on inputs
- `cursor: default`, reduced text color
- No focus styling (readonly inputs don't activate the wrapper)

#### Pending State
- Inputs show placeholder values from the prescribed target (not pre-filled — user must actively enter or accept)
- Placeholders render in `--color-text` at full brightness — this is the primary call to action
- **Confirm (✓):** Logs the set with entered values. If no values entered, logs with prescribed target values (auto-fill on confirm).
- **Skip (×):** Small, muted, left of confirm button. Opacity 0.6 by default, turns rose on hover.

#### Completed State
- Same input layout with `readonly` — values display inline, perfectly aligned with pending rows
- **PR badge:** Gold pill — Lucide `Trophy` (10px) + "PR" text. `--color-celebrate` on `--color-celebrate-muted`. Appears inline after the values.
- **Row fades to 0.55 opacity** — done work recedes so the pending set stands out
- **Undo:** Tap ✓ again to return to pending state. Row returns to full opacity.

#### Skipped State
- `text-decoration: line-through` on inputs, unit label, and × separator
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

### Exercise Swaps
- **Trigger:** Swipe left on exercise card header (60px threshold). Horizontal swipe detection via pointer events; vertical scrolls are ignored and don't trigger the swap gesture.
- **Animation:** 3D flip-card using CSS perspective (800px). Front face (`rotateY(0deg)` → `rotateY(-180deg)`) is the exercise card; back face (`rotateY(180deg)` → `rotateY(0deg)`) is the alternatives list. Transition: 0.5s cubic-bezier, `backface-visibility: hidden`.
- **Back face layout:** Up to 3 alternative exercises as stacked buttons. Each shows exercise name + equipment tag. Loading state ("Loading alternatives...") while fetching; empty state ("No alternatives available") if none found.
- **Data source:** Pre-generated alternatives from `planned_exercises.alternatives` (jsonb array of `ExerciseAlternative` objects). If unavailable, fetches from `/api/swap-alternatives` — ExerciseDB fallback querying by same target muscle + user's equipment, returns top 3.
- **Swap action:** Tap an alternative → POST to `/api/swap-exercise` with `planned_exercise_id`, `new_exercise_id`, `new_exercise_name`. Server deletes old set_logs and planned_sets, updates exercise row (clears notes, rationale, and alternatives to null), inserts 3 fresh default sets (10 reps, null target weight). Card flips back to front face; page data refreshes via `invalidateAll()`.
- **Swipe right:** Flips card back to front face without performing a swap.
- **Close button:** Back face includes an × button (Lucide `X`) to flip back without swapping.

### AI Rationale
- **When shown:** Only when exercise card is expanded AND `exercise.rationale` is non-null.
- **Position:** Below card header (after notes line), above set rows.
- **Visual treatment:** `--text-xs` font size, `--color-text-tertiary`, italic, opacity 0.7. Reads as a subtle coach note — informational, not a call to action.
- **Content:** Brief "why this exercise" note generated inline during plan generation (system prompt rule 14). Stored in `planned_exercises.rationale` (text, nullable).
- **After swap:** Rationale is cleared (set to null). The replacement exercise has no rationale.

### Completion Summary
- Appears when **all sets have a status** (no pending). Replaces the progress bar at the top of the exercise list.
- **Theme:** Celebrate (gold) — completing a workout is an achievement.
- **Layout:** Title → Progress Bar → Stats (top-down: statement → visual proof → details).
- **Header:** Inline layout — small gold ring (28px) with check icon + "Workout Complete" in `--color-celebrate`, display font bold. Compact, not centered/stacked.
- **Progress bar:** Full segmented bar (same as during-workout bar) — mint, gold, and rose segments showing the complete picture. The bar the user watched fill up is now complete inside the card.
- **Stats row:** Compact inline text with dot separators. Done (mint) · Skipped (default text, hidden if zero — "the bar already told that story") · PRs with Trophy icon (gold, conditional) · Volume with Flame icon (tertiary).
- **No CTA:** Navigation to weekly plan is handled by the segmented control and bottom nav. The summary card is pure celebration, no competing navigation action.
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
- [ ] Edit button — planned for left slot (primary views) / right slot (drill-down). Allows reordering exercises or days depending on active view. Header layout reserves empty placeholder slots for this.

## Routing

- Auth guard (`hooks.server.ts`) redirects authenticated + onboarded users to `/workout`
- `/workout` (no `[day]` param) resolves today's day index server-side
- `/workout/[day]` loads a specific day's workout (linked from weekly agenda)
- Navigation between `/workout` and `/plan` via segmented control (no page reload — SvelteKit client-side navigation with crossfade transition)
