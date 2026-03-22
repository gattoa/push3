# PUSH — UX Design Brief

> Context document for UX design exploration · March 2026 · v0.1.0

## 1. Product Overview

Push is a mobile-first PWA that delivers AI-powered, personalized weekly workout programming. The core value loop is: Onboarding → Plan Generation → Workout Logging → Check-In → Re-Generation. Each cycle makes the next plan smarter using accumulated performance data.

The current implementation is a Proof of Concept that validates the data loop works end-to-end. The UX was built to prove functionality, not to optimize the in-gym experience. This brief provides the context needed to design a production-quality gym-floor interface.

## 2. Technical Context

- **Framework:** SvelteKit + Svelte 5 (runes) + TypeScript strict mode
- **Backend:** Supabase (Postgres + Auth + RLS)
- **AI:** Anthropic Claude API (synchronous, structured output via tool use)
- **Exercise Data:** Self-hosted ExerciseDB v1 (Vercel) — GIFs, instructions, muscle groups
- **Hosting:** Vercel (adapter-vercel, nodejs22.x runtime)
- **Auth:** Google OAuth via Supabase
- **PWA:** Manifest + manual service worker (offline not yet functional)

## 3. Current Design System

## Color Palette


## Typography

Display: JetBrains Mono (700, 800) — headers, numbers, labels. Technical, data-forward aesthetic.

Body: Inter (400, 500, 600) — copy, form inputs, descriptions.

## Spacing & Components

- **Border radius:** 12px (cards), 8px (buttons, small elements)
- **Min touch target:** 36px × 36px (nav icons, avatar, back button)
- **Max content width:** 480px (mobile-first, centered)
- **Safe areas:** CSS variables for iPhone notch/dynamic island (`--safe-top`, `--safe-bottom`)


## 4. Information Architecture

## Route Map

```
/                    → Login (Google OAuth)
/onboarding          → 6-step profile setup (new users only)
/plan/generate       → Loading state during AI plan generation
/workout             → TODAY’S WORKOUT (home screen)
/workout/[day]       → Specific day workout (from weekly plan)
/plan                → Weekly agenda (all 7 days at a glance)
/check-in            → End-of-week feedback form
/exercise/[id]       → Exercise reference (GIF + instructions)
```

## Navigation Principles

- Daily-first: /workout is the entry point post-auth, not a plan view

- No persistent bottom nav: navigation is contextual (header icons/links)

- Today detection: server-side, maps current day to planned_day.day_index

- Auth guard: unauthenticated → /, authenticated + not onboarded → /onboarding, onboarded → /workout

## Primary User Flows

During-week: Open app → /workout (today) → log sets → done

End-of-week: /workout → complete last sets → /check-in → submit → /plan/generate (10-20s) → /plan (new week)

Reference: /workout → tap exercise name → /exercise/[id] (GIF + instructions) → back


## 5. Screen Inventory

## Login (/)

Centered layout with ambient glow effects, barbell icon, large animated title, Google OAuth button, and tagline. Animations create perceived quality. No error state in UI (logged to console only).

## Onboarding (/onboarding)

6-step wizard with progress bar. Collects: goals (single-select cards), experience (single-select cards), equipment (multi-select chips, 12 options), training days + session duration (numeric chips), unit preference (lb/kg toggle), injuries (free text). Final step submits and redirects to plan generation.

## Today’s Workout (/workout) — Home Screen

Header: list icon (left, → /plan) + date/split label (center) + avatar with sign-out dropdown (right). Progress bar showing completed+skipped / total sets. Exercise cards with set table: columns for Set #, Target, Weight input, Reps input, Complete/Skip buttons. Immediate save on button press. Completion summary card appears when all sets have a status.

## Weekly Agenda (/plan)

Header: “← Today” (left) + “This Week” (center) + “Check-In →” (right). Seven day cards with split label, exercise/set counts, mini progress bar. Today’s card highlighted with accent border. Rest days show reduced opacity. Cards link to /workout/[day].

## Check-In (/check-in)

Week summary stats (2×2 grid: days trained, completion %, volume, skipped). Form fields: body weight (optional), current injuries (pre-filled, comma-separated text), equipment (pre-filled), free-text notes for AI coach. Submit triggers: upsert check-in, update settings, mark plan completed, redirect to /plan/generate.

## Exercise Detail (/exercise/[id])

Back button, full-width GIF from ExerciseDB, exercise name, equipment/target tags, secondary muscles, numbered instructions. Read-only reference page.

## Plan Generation (/plan/generate)

Centered loading state with pulsing ring animation. On error: error message + retry button. On success: redirect to /plan.


## 6. Data Model (UX-Relevant)

## User Settings


## Plan Structure

weekly_plans → planned_days (7 per plan) → planned_exercises (4-6 per day) → planned_sets (3-5 per exercise) → set_logs (actual performance). Week 1 has null target weights (cold start). Week 2+ prescribes weights based on logged baselines.

## Set Logging

Each set log captures: actual_weight, actual_reps, status (pending | completed | skipped). Saved immediately via /api/log-set POST (upsert pattern). No manual save button.

## Check-In Data

Captures: body_weight, injury_changes, equipment_changes, free-text notes. Upsert per user per week. Notes surfaced prominently to AI coach in generation prompt.


## 7. Known UX Pain Points

These are issues identified from code analysis and initial testing. The POC was built to prove data flow, not optimize the gym-floor experience.

## Set Logging Friction

Currently requires typing weight + reps + tapping complete per set. Too many interactions while sweaty and between sets. Opportunities: quick-log (tap to confirm target), swipe gestures, increment/decrement steppers, pre-fill from target weight.

## No Historical Context

Users can’t see what they lifted last week while logging. The data exists in historical_set_logs (available in generation context) but isn’t surfaced in the workout UI. Showing “Last: 185×8” next to each exercise would reduce guesswork.

## No Rest Timer

Most lifters need a rest timer between sets. It’s also a natural trigger for “log the set you just finished.” Currently absent.

## Navigation

Link-based routing with no bottom tab bar or swipe gestures. Works but feels like a web page, not a native app. Consider persistent bottom nav or swipe navigation.

## Check-In Form

Text-heavy: comma-separated inputs for injuries and equipment. Could be simplified to toggles, chips, or structured inputs that match the onboarding pattern.

## Cold Start UX

Week 1 exercises show no target weight (by design — no baseline exists). But there’s no prompt to help users estimate a starting weight. Could show: “First time? Enter your working weight to set a baseline.”

## No Undo

Mark-complete and skip actions save immediately with no undo. An undo toast (“Set marked complete — Undo” with 5s window) would add a safety net for accidental taps.

## Offline

App is online-only. Gym basements often have poor connectivity. PWA manifest exists but no offline caching or background sync. Logging should work offline and sync when connection returns.


## 8. Key Design Decisions & Rationale


## 9. Design Scope

The POC validates the feedback loop works. The next phase is making it feel good to use in the gym. Priority areas:

- Set logging interaction — reduce taps-to-log, add quick-complete and swipe gestures

- Historical performance — surface last-week data inline during logging

- Rest timer — between-set countdown with log prompt

- Navigation pattern — evaluate bottom tab bar, swipe, or hybrid

- Check-in simplification — structured inputs over free text

- Offline resilience — log sets without connectivity, sync later


This document provides the full context needed to explore UX direction. All current screens, data models, navigation flows, design tokens, and known pain points are included. The codebase is SvelteKit + Svelte 5 on Vercel — any design that can be expressed in HTML/CSS/JS is implementable.