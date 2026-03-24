# Progress — `/progress`

> The athlete's command center. History, stats, personal records, and settings. Second tab in persistent bottom nav.

## Role

Progress is the counterpart to the Workout tab. Where Workout is about *today* — what to do and logging it — Progress is about *over time*. It answers: "Is this working?" by surfacing trends, personal records, and training history. It also houses settings (unit preference, profile) so the Workout tab stays focused.

This screen replaces the "Profile" concept from the product brief. Same content, better framing — athletes don't think about their profile, they think about their progress.

## Layout

```
┌─────────────────────────────┐
│ [Profile Nameplate]      [⚙]│  ← Name/avatar + settings gear
├─────────────────────────────┤
│                              │
│  ┌─ Streak & Summary ──────┐│
│  │ 🔥 3-week streak         ││  ← Consecutive weeks completed
│  │ 12 workouts · 48,200 lb  ││  ← All-time totals
│  └──────────────────────────┘│
│                              │
│  ┌─ Body Weight Trend ─────┐│
│  │  ╭──╮                    ││  ← Sparkline chart
│  │ ╭╯  ╰──╮  ╭──           ││     (check-in body weight over weeks)
│  │╯       ╰──╯              ││
│  │ W1  W2  W3  W4  W5      ││
│  └──────────────────────────┘│
│                              │
│  ┌─ Personal Records ──────┐│
│  │ Bench Press    185 lb    ││  ← Estimated 1RM (Epley)
│  │ Squat          225 lb    ││
│  │ Deadlift       275 lb    ││
│  │ OHP            105 lb    ││
│  │ [See all →]              ││
│  └──────────────────────────┘│
│                              │
│  ┌─ Training Calendar ─────┐│
│  │  M  T  W  T  F  S  S    ││  ← Current month grid
│  │  ●  ●  ○  ●  ○  ○  ○    ││     ● = trained, ○ = rest/skipped
│  │  ●  ●  ○  ●  ○  ○  ○    ││
│  │  ●  ·  ·  ·  ·  ·  ·    ││     · = future
│  │ [← Mar 2026 →]          ││
│  └──────────────────────────┘│
│                              │
├─────────────────────────────┤
│  [ Workout ]    [ Progress ] │  ← Persistent bottom nav
└─────────────────────────────┘
```

## Sections

### 1. Profile Nameplate

- **Left:** Avatar (from OAuth provider) + display name
- **Right:** Settings gear icon → navigates to `/progress/settings`
- Minimal — this is not a social profile, it's an identity anchor

### 2. Streak & Summary

- **Streak:** Count of consecutive weeks where the athlete completed at least one workout and submitted a check-in. Resets if a full week passes with no activity.
- **All-time totals:** Total workouts completed (days with ≥1 logged set), total volume lifted (sum of weight × reps across all completed sets)
- Display font (JetBrains Mono) for numbers

### 3. Body Weight Trend

- **Data source:** `check_ins.body_weight` plotted per week
- **Visualization:** Sparkline chart — minimal, no axis labels, just the shape of the trend. Tap to expand to a full chart with values.
- **Empty state (Week 1):** "Complete your first check-in to start tracking" with muted text
- **Missing weeks:** Gap in line (don't interpolate)

### 4. Personal Records

- **Data source:** All `set_logs` where `status = 'completed'`. Calculate estimated 1RM per exercise using Epley formula: `weight × (1 + reps / 30)`
- **Display:** Top exercises by estimated 1RM, sorted descending. Show exercise name + best estimated 1RM in user's unit preference.
- **"See all" link:** Expands to full PR list, grouped by muscle group
- **Empty state (Week 1 cold start):** "Log your first workout to start tracking PRs"
- **PR improvements:** When a PR was set in the current week, show a subtle accent indicator (e.g., ↑ arrow or "NEW" badge)

### 5. Training Calendar

- **Data source:** `planned_days` + `set_logs`. A day is "trained" if it has ≥1 completed set log.
- **Display:** Month grid with filled/empty dots. Current month shown by default. Navigate between months.
- **Tap interaction:** Tapping a trained day shows a mini-summary tooltip: split label, sets completed, total volume.
- **Empty state:** Grid renders with all dots as future/empty. No special message needed.

## Settings (`/progress/settings`)

Accessible via gear icon in the profile nameplate. Contains:

| Setting | Type | Notes |
|---|---|---|
| Unit preference | Toggle (lb / kg) | Moved here from onboarding per `onboarding.md` spec |
| Training days per week | Chip select (2–6) | Editable between cycles |
| Session duration | Chip select (30–90 min) | Editable between cycles |
| Sign out | Button | Clears session, redirects to `/` |

**Scope note:** Settings that affect plan generation (training days, session duration) only take effect on the *next* plan generation cycle. Changing them mid-week does not alter the current plan. This should be communicated clearly in the UI.

## Design Decisions

### Visual Hierarchy
- Streak & Summary at top — immediate positive reinforcement on every visit
- Body weight trend second — answers "is my body changing?"
- Personal records third — answers "am I getting stronger?"
- Calendar last — historical reference, not a primary engagement driver

### Data Freshness
- All data read from Supabase on page load. No client-side caching for the Progress tab — it should always reflect the latest state.
- Volume and PR calculations can be done client-side from the set_logs data, or via a dedicated RPC if performance requires it.

### Design System
- Cards use `--color-surface` background with `--color-border` edges, consistent with workout and plan cards
- Numbers in `--font-display` (JetBrains Mono), labels in `--font-body` (Inter)
- Accent green (`--color-accent`) for streaks, PRs, and positive trend indicators
- Touch targets: 44px minimum for all interactive elements

## States

| State | Description |
|---|---|
| **Cold start (no data)** | Streak shows 0, no chart, no PRs, empty calendar. Encouraging copy: "Your progress starts with your first workout." |
| **Week 1 (some data)** | Partial data — some sets logged but no check-in yet. PRs populate as sets are logged. Calendar shows current week only. |
| **Active (multi-week)** | Full data across all sections. Streak, chart, PRs, and calendar all populated. |
| **Lapsed (gap in activity)** | Streak resets to 0. Chart and calendar show the gap. No judgment copy — just the data. |

## Data Requirements

### Existing (no schema changes needed)
- `set_logs` — volume calculation, PR calculation, calendar dots
- `check_ins` — body weight trend
- `planned_days` — calendar context (which days were scheduled)
- `user_settings` — unit preference, profile data

### Potentially needed
- **RPC: `get_progress_summary`** — If client-side calculation of all-time volume and PRs becomes expensive, a server-side RPC that returns pre-aggregated stats would be cleaner. Defer until performance requires it.
- **Streak tracking** — Can be derived from `weekly_plans` (consecutive weeks with `status = 'completed'`) or `check_ins` (consecutive week_numbers). No new table needed.

## Open Questions

- [ ] Should body weight trend include a goal line (e.g., target weight)? Requires a new field in `user_settings`.
- [ ] Should PRs show absolute weight or estimated 1RM? Estimated 1RM is more meaningful but less intuitive for beginners.
- [ ] Calendar: month view only, or option for a year heatmap (GitHub-style)?
- [ ] Should exercise-level history be accessible from Progress (tap a PR → see that exercise's history over time)?

## Routing

- `/progress` — main progress view (this spec)
- `/progress/settings` — settings sub-page
- Bottom nav tab always visible, highlighted when on any `/progress/*` route
