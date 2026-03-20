# Design Documentation

Design decisions and specifications for Push, organized per-page with a shared overview.

## Navigation Architecture

**Primary screen:** Daily Workout (`/workout`)
**Secondary screen:** Weekly Agenda (`/plan`)

Flow: App open → `/workout` (today's workout) ↔ `/plan` (weekly agenda)

The daily workout is what users see every time they open the app. The weekly agenda is a planning/review tool accessed via a list icon in the daily view header.

## Global Design Decisions

- **Daily-first navigation:** The app opens to today's workout, not a weekly overview. Reduces friction between opening the app and logging sets.
- **No persistent bottom nav:** Navigation is contextual — header icons link between the two primary views.
- **No week number in UI:** Week number is an internal concept for plan generation. Users see date + workout name instead.
- **Full plan load, filter client-side:** Both views load via `get_full_plan()` RPC and filter to the relevant day/week. Optimization deferred.
- **Rest day state:** Needed on the daily view when today is a rest day. Design deferred.

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
| Daily Workout (`/workout`) | [daily-workout.md](daily-workout.md) | In Progress |
| Weekly Agenda (`/plan`) | [weekly-agenda.md](weekly-agenda.md) | Planned |
| Exercise Detail (`/exercise/[id]`) | [exercise-detail.md](exercise-detail.md) | Planned |
| Login (`/`) | — | No changes planned |
| Onboarding (`/onboarding`) | — | No changes planned |
| Plan Generation (`/plan/generate`) | — | No changes planned |
