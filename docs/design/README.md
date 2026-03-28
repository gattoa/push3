# Design Documentation

Design decisions and specifications for Push, organized per-page with a shared overview.

## Navigation Architecture

**Two-tab bottom nav** (Workout and Progress) — component exists (`BottomNav.svelte`) but is **hidden pending Progress page implementation**.

- **Workout tab** (primary): Today's workout is the default view. Weekly agenda (`/plan`) accessed via segmented tab control [Week | Today] in the header.
- **Progress tab**: Historical calendar, stats, PRs, settings. Replaces the "Profile" concept from the product brief. *Placeholder only — deferred.*

Flow: App open → `/workout` (today) ↔ `/plan` (weekly agenda via [Week | Today] segment). Check-in and plan review surface via contextual banners on the Workout tab.

See [UX-DESIGN-BRIEF.md](UX-DESIGN-BRIEF.md) Section 4 and Section 8 (Cluster A decisions) for full specification.

## Global Design Decisions

- **Daily-first navigation:** The app opens to today's workout, not a weekly overview. Reduces friction between opening the app and logging sets.
- **Two-tab bottom nav (planned):** Workout + Progress. Component built, hidden until Progress page is implemented.
- **No week number in UI:** Week number is an internal concept for plan generation. Users see date + workout name instead.
- **Full plan load, filter client-side:** Both views load via `get_full_plan()` RPC and filter to the relevant day/week. Optimization deferred.
- **Rest day state:** Week-so-far summary + next training day preview (read-only, full exercise list). Week 1 cold start shows motivational welcome message.
- **Touch targets:** 44px × 44px minimum. 16pt minimum font size. 4.5:1 contrast ratio.
- **Historical performance:** "Last: [weight]×[reps]" per exercise. PR icon via estimated 1RM (Epley).
- **Banner system:** Plan review and check-in banners on Workout tab. At most one at a time. Persist 48 hours or until dismissed.
- **Exercise swaps:** Swipe left on exercise card → inline expansion with 3 AI-pre-generated alternatives. Target: alternatives generated during plan generation. Requires isolated prompt testing before implementation.

## Brand & Design System

- **[Brand Guidelines](brand-guidelines.md)** — Visual identity, color semantics, shape language, motion, and mood. Source of truth for all design decisions.
- **`src/styles/tokens.css`** — CSS variables implementing the brand guidelines.
- **`/design-system`** — Live preview page showing tokens and components in action.

## Page Specifications

All page-level design specs live in [`pages/`](pages/).

| Page | Doc | Status |
|---|---|---|
| Daily Workout (`/workout`) | [pages/daily-workout.md](pages/daily-workout.md) | Current (v0.4.0 — segmented tab navigation, [day] drill-down header, navigation model) |
| Weekly Agenda (`/plan`) | [pages/weekly-agenda.md](pages/weekly-agenda.md) | Current (v0.2.0 — segmented tab navigation, avatar, navigation model) |
| Exercise Detail (`/exercise/[id]`) | [pages/exercise-detail.md](pages/exercise-detail.md) | Current |
| Weekly Check-In (`/check-in`) | [pages/check-in.md](pages/check-in.md) | Current (v0.2.0 — entry point consolidated to banner-only) |
| Onboarding (`/onboarding`) | [pages/onboarding.md](pages/onboarding.md) | Current (v0.2.0 — reordered steps, DOB + gender, unit pref removed, injury yes/no gate, schema reqs) |
| Progress (`/progress`) | [pages/progress.md](pages/progress.md) | Planned (placeholder only — implementation deferred) |
| Login (`/`) | — | No changes planned |
| Plan Generation (`/plan/generate`) | — | No changes planned |
