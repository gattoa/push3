# Design Documentation

Design decisions and specifications for Push, organized per-page with a shared overview.

## Navigation Architecture

**Persistent two-tab bottom nav:** Workout and Progress.

- **Workout tab** (primary): Today's workout is the default view. Weekly agenda (`/plan`) accessed via header icon.
- **Progress tab**: Historical calendar, stats, PRs, settings. Replaces the "Profile" concept from the product brief.

Flow: App open → `/workout` (today) ↔ `/plan` (weekly agenda via header icon). Check-in and plan review surface via contextual banners on the Workout tab.

See [UX-DESIGN-BRIEF.md](UX-DESIGN-BRIEF.md) Section 4 and Section 8 (Cluster A decisions) for full specification.

## Global Design Decisions

- **Daily-first navigation:** The app opens to today's workout, not a weekly overview. Reduces friction between opening the app and logging sets.
- **Persistent two-tab bottom nav:** Workout + Progress. Replaces the previous contextual header-only navigation.
- **No week number in UI:** Week number is an internal concept for plan generation. Users see date + workout name instead.
- **Full plan load, filter client-side:** Both views load via `get_full_plan()` RPC and filter to the relevant day/week. Optimization deferred.
- **Rest day state:** Week-so-far summary + next training day preview (read-only, full exercise list). Week 1 cold start shows motivational welcome message.
- **Touch targets:** 44px × 44px minimum. 16pt minimum font size. 4.5:1 contrast ratio.
- **Historical performance:** "Last: [weight]×[reps]" per exercise. PR icon via estimated 1RM (Epley).
- **Banner system:** Plan review and check-in banners on Workout tab. At most one at a time. Persist 48 hours or until dismissed.
- **Exercise swaps:** Swipe left on exercise card → inline expansion with 3 AI-pre-generated alternatives. Target: alternatives generated during plan generation. Requires isolated prompt testing before implementation.

## Design System Reference

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#0a0a0a` | Page background |
| `--color-surface` | `#141414` | Cards, elevated surfaces |
| `--color-border` | `#262626` | Subtle borders |
| `--color-text` | `#fafafa` | Primary text |
| `--color-text-muted` | `#a1a1aa` | Secondary/label text |
| `--color-accent` | `#22c55e` | CTAs, active states, progress |
| `--font-display` | JetBrains Mono | Headers, numbers, labels |
| `--font-body` | Inter | Body text, form inputs |
| `--radius` | `12px` | Cards |
| `--radius-sm` | `8px` | Buttons, smaller elements |

## Page Documents

| Page | Doc | Status |
|---|---|---|
| Daily Workout (`/workout`) | [daily-workout.md](daily-workout.md) | Current (v0.2.0 — banners, historical perf, rest day state, exercise swaps, completion summary updated) |
| Weekly Agenda (`/plan`) | [weekly-agenda.md](weekly-agenda.md) | Current (v0.2.0 — check-in link removed, plan review destination added) |
| Exercise Detail (`/exercise/[id]`) | [exercise-detail.md](exercise-detail.md) | Current |
| Weekly Check-In (`/check-in`) | [check-in.md](check-in.md) | Current (v0.2.0 — entry point consolidated to banner-only) |
| Onboarding (`/onboarding`) | [onboarding.md](onboarding.md) | Current (v0.2.0 — reordered steps, DOB + gender, unit pref removed, injury yes/no gate, schema reqs) |
| Progress (`/progress`) | — | New screen — design spec TBD |
| Login (`/`) | — | No changes planned |
| Plan Generation (`/plan/generate`) | — | No changes planned |
