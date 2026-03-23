# PUSH — UX Design Brief

> Context document for UX design exploration · March 2026 · v0.2.0

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
- **Min touch target:** 44px × 44px — all interactive elements (nav icons, set logging buttons, header icons, form inputs, exercise name tap areas). Per iOS HIG and gym-specific accessibility research [[R014](../research/Research-Findings-Report.md), [F030](../research/Research-Findings-Report.md)].
- **Min font size:** 16pt — body text floor for gym-floor readability. Display text (headers, numbers) should exceed this. [[R014](../research/Research-Findings-Report.md), [F031](../research/Research-Findings-Report.md)].
- **Contrast ratio:** 4.5:1 minimum (WCAG AA). Test under gym lighting conditions.
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
/progress            → Progress: history, stats, PRs, settings (new — design spec TBD)
/exercise/[id]       → Exercise reference (GIF + instructions)
```

## Navigation Pattern

**Persistent two-tab bottom nav:** Workout and Progress.

- **Workout tab** (daily-first): Today's workout is the default view. The weekly agenda (`/plan`) is a secondary view accessed via a header icon. This tab is where all training activity happens — logging, reviewing the week, and checking in.
- **Progress tab**: The user's command center for historical data, stats, personal records, and settings. Replaces the "Profile" concept from the product brief (same content, renamed). Settings accessible via nameplate or gear icon.

Rationale: Persistent bottom nav provides constant orientation, solves rest day navigation (user can always tap Progress), and bridges the native-app perception gap for a PWA. Two tabs keeps the bar minimal — ~56px total height at 44px touch targets. [[R014](../research/Research-Findings-Report.md), [F004](../research/Research-Findings-Report.md), [F011](../research/Research-Findings-Report.md), [I007](../research/Research-Findings-Report.md)].

## Navigation Principles

- Daily-first: `/workout` is the entry point post-auth, not a plan view
- Today detection: server-side, maps current day to `planned_day.day_index`
- Auth guard: unauthenticated → `/`, authenticated + not onboarded → `/onboarding`, onboarded → `/workout`
- Weekly agenda: accessed from Workout tab via header icon (list/calendar icon)
- No week number in UI: week number is internal. Users see date + workout name.

## Banner System (Workout Tab)

The Workout tab surfaces two contextual banners. At most one banner at a time — they are sequential in the weekly cycle, never simultaneous.

1. **Plan review banner** — Appears after new plan generation. Shows a compact week overview (training days, splits, exercise counts). Tapping navigates to the weekly agenda (`/plan`) where the full plan review and editing lives. The banner is the trigger; the agenda is the experience.
2. **Check-in banner** — Appears when the check-in day arrives (fixed to Sunday for POC; configurable post-POC), regardless of whether all training days are complete. Tapping navigates to `/check-in`.

**Persistence rule:** Both banners persist for 48 hours or until dismissed, whichever comes first.

## Primary User Flows

During-week: Open app → `/workout` (today) → log sets → done

End-of-week: Check-in banner appears on Workout tab → `/check-in` → submit → `/plan/generate` (10-20s) → plan review banner appears → tap → `/plan` (new week)

Reference: `/workout` → tap exercise name → `/exercise/[id]` (GIF + instructions) → back

Rest day: Open app → `/workout` (rest day state: week summary + next workout preview) → optionally tap Progress tab


## 5. Screen Inventory

## Login (/)

Centered layout with ambient glow effects, barbell icon, large animated title, Google OAuth button, and tagline. Animations create perceived quality. No error state in UI (logged to console only).

## Onboarding (/onboarding)

6-step wizard with progress bar. Ordering follows personal → contextual → practical → safety, mirroring a natural trainer conversation. Steps: (1) About You — DOB + gender (Male / Female / Prefer not to say), (2) Experience level — single-select cards (beginner / intermediate / advanced), (3) Goals — single-select cards (build_muscle / build_strength / lose_fat / general_fitness), (4) Equipment — multi-select chip grid (12 options), (5) Schedule — training days/week + session duration (chip selectors, defaults: 4 days, 60 min), (6) Injuries — yes/no gate ("Do you have any current injuries or pain?" → if yes, expand to body region selection or free text). Unit preference removed (defaults to lb, changeable in Progress tab settings). Final step submits and redirects to plan generation.

## Today’s Workout (/workout) — Home Screen

Header: list icon (left, → /plan) + date/split label (center) + avatar with sign-out dropdown (right). Progress bar showing completed+skipped / total sets. Banner slot above content for plan review or check-in banners (see Banner System). Exercise cards with: exercise name, “Last: [weight]×[reps]” reference line (when historical data exists), set table with columns for Set #, Target, Weight input, Reps input, Complete/Skip buttons. PR icon appears on a set row when the logged set’s estimated 1RM (Epley formula) exceeds the user’s previous best for that exercise. Immediate save on button press. Completion summary card appears when all sets have a status.

**Rest day state:** When today is a rest day, the Workout tab shows: (1) week-so-far summary (days trained, sets completed, completion %), and (2) next training day preview with full exercise list — read-only, no logging inputs, muted styling, clearly labeled (e.g. “Up Next — Wednesday”). Exercise names in the preview link to `/exercise/[id]`. **Week 1 cold start:** If no workouts have been logged yet, the week-so-far summary is replaced with a motivational/contextual welcome message (e.g. “Your first week — focus on learning the movements and finding your weights”). [[F020](../research/Research-Findings-Report.md), [F021](../research/Research-Findings-Report.md), [R005](../research/Research-Findings-Report.md)].

**Cold start (Week 1):** No “Last” reference line (no data exists). No target weights (by design). Exercise cards show name, notes, and empty inputs only.

## Weekly Agenda (/plan)

Header: “← Today” (left) + “This Week” (center). Seven day cards with split label, exercise/set counts, mini progress bar. Today’s card highlighted with accent border. Rest days show reduced opacity. Cards link to `/workout/[day]`. Also serves as the destination for the plan review banner — where the user reviews and can edit their new weekly plan.

## Progress (/progress)

The user’s command center. Contains: historical calendar (date-indexed archive of workouts), body weight trends, personal records (based on estimated 1RM per exercise), progress stats. Settings accessible via profile nameplate or gear icon. Replaces the “Profile” concept from the product brief. This is a new screen — design spec TBD.

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

## No Historical Context — RESOLVED (Cluster A, Decision 4)

Each exercise card now shows a “Last: [weight]×[reps]” reference line below the exercise name when historical data exists. PR icon appears when a set’s estimated 1RM (Epley) exceeds the user’s all-time best for that exercise. No pre-filled inputs — the AI’s prescribed target weight is the primary historical intelligence. [[F004](../research/Research-Findings-Report.md), [F036](../research/Research-Findings-Report.md), [R004](../research/Research-Findings-Report.md)].

## No Rest Timer

Most lifters need a rest timer between sets. It’s also a natural trigger for “log the set you just finished.” Currently absent.

## Navigation — RESOLVED (Cluster A, Decision 1)

Persistent two-tab bottom nav (Workout + Progress). Weekly agenda via header icon. Check-in via contextual banner on Workout tab. See Section 4 for full specification.

## Check-In Form

Text-heavy: comma-separated inputs for injuries and equipment. Could be simplified to toggles, chips, or structured inputs that match the onboarding pattern.

## Cold Start UX

Week 1 exercises show no target weight (by design — no baseline exists). But there’s no prompt to help users estimate a starting weight. Could show: “First time? Enter your working weight to set a baseline.”

## No Undo

Mark-complete and skip actions save immediately with no undo. An undo toast (“Set marked complete — Undo” with 5s window) would add a safety net for accidental taps.

## Offline

App is online-only. Gym basements often have poor connectivity. PWA manifest exists but no offline caching or background sync. Logging should work offline and sync when connection returns.


## 8. Key Design Decisions & Rationale

### Cluster A — "What does the home screen actually look like?"

Decisions 1–4 were resolved together because they are interdependent: navigation constrains screen layout, rest day state depends on navigation, historical performance affects exercise card density, and touch targets set physical constraints for all of it.

**Decision 1: Navigation — Persistent two-tab bottom nav**

Two tabs: Workout (daily-first) and Progress (history, stats, PRs, settings). Progress replaces the product brief's "Profile" concept — same content, renamed. Weekly agenda accessed via header icon on the Workout tab. Check-in is contextual: a single entry point via a prompt banner on the Workout tab when the check-in day arrives (fixed to Sunday for POC, configurable post-POC). Plan review is also a banner — appears after generation, tapping navigates to the agenda for full review and editing. Both banners persist 48 hours or until dismissed. At most one banner at a time.

Evidence: [[R014](../research/Research-Findings-Report.md)] bottom-screen navigation recommended for gym accessibility. [[F004](../research/Research-Findings-Report.md)] Strong/Hevy use bottom-tab as primary nav. [[F011](../research/Research-Findings-Report.md)] No popular workout app is a PWA — persistent nav helps bridge the native-app perception gap. [[I007](../research/Research-Findings-Report.md)] PWA viable but must feel native.

**Decision 2: Touch targets & accessibility**

44px × 44px minimum touch targets on all interactive elements. 16pt minimum font size for body text. 4.5:1 contrast ratio minimum (WCAG AA).

Evidence: [[F030](../research/Research-Findings-Report.md)] iOS HIG recommends 44×44px. [[F031](../research/Research-Findings-Report.md)] 16pt+ fonts and 4.5:1 contrast for gym readability. [[R014](../research/Research-Findings-Report.md)] Gym-specific accessibility standards (high priority).

**Decision 3: Rest day state + banner system**

Rest day Workout tab shows: (1) week-so-far summary (days trained, sets completed, completion %), and (2) next training day preview with full exercise list — read-only, muted styling, clearly labeled "Up Next — [Day]." Exercise names link to `/exercise/[id]`. Week 1 cold start replaces the empty summary with a motivational welcome message. The banner system provides two sequential contextual banners on the Workout tab: plan review (after generation) and check-in (when check-in day arrives). Banners persist 48 hours or until dismissed.

Evidence: [[F020](../research/Research-Findings-Report.md)] 77% of users drop within 3 days without engagement — rest days are the highest-risk moments. [[F021](../research/Research-Findings-Report.md)] Daily Week 1 engagement → 80% higher 6-month retention. [[R005](../research/Research-Findings-Report.md)] Design Week 1 for retention with daily touchpoints. [[I009](../research/Research-Findings-Report.md)] Review Day addresses multiple retention drivers.

**Decision 4: Historical performance in workout UI**

Each exercise card shows "Last: [weight]×[reps]" below the exercise name as a confidence signal for the AI's prescribed target. PR icon appears on a set row when the set's estimated 1RM (Epley formula: weight × (1 + reps/30)) exceeds the user's previous best e1RM for that exercise. No pre-filled inputs — the AI's target weight is the primary historical intelligence, and pre-filling with last session data would conflict with the AI's progressive overload recommendations. Week 1 (cold start): no "Last" line, no target weights.

Evidence: [[F004](../research/Research-Findings-Report.md)] Strong/Hevy use auto-filled previous values — Push diverges intentionally because AI targets serve this role. [[F005](../research/Research-Findings-Report.md)] No app balances quick-complete with detailed logging. [[F033](../research/Research-Findings-Report.md)] LLM safety with grounding — "Last" line shows the data the AI used, building trust. [[F036](../research/Research-Findings-Report.md)] Estimated 1RM (Epley) is validated as a no-ML progression metric. [[R004](../research/Research-Findings-Report.md)] Same e1RM calculation powers deload detection and Progress tab trends.

### Cluster B — "What are the signature moments?"

**Decision 5: Exercise Swaps**

Swipe left on an exercise card during an active workout to initiate a swap. The card expands inline (below the exercise header, above the set table) to show 3 alternative exercises as compact rows (exercise name + equipment tag). The original exercise remains visible at top for comparison. Tapping an alternative replaces the exercise in place — sets reset, no logged data carries over. Cancel collapses the expansion and keeps the original. One-time swap per the product brief — no persistent gym memory, no location tracking.

**Data source (target):** Alternatives are pre-generated by the AI during weekly plan generation. For each prescribed exercise, the AI selects 2-3 alternatives considering: same target muscle, different movement pattern, available equipment, injury constraints, no duplication within the week's plan. Stored in `planned_exercises.alternatives` (JSON array of exercise IDs). Fetched with the plan — zero latency at swap time. Cost impact: ~810 additional output tokens per generation (~$0.006/user/week on Batch API).

**Implementation flag:** Pre-generated alternatives require modifications to the generation prompt, tool schema, database schema, and RPC functions. The current generation pipeline has been tuned through multiple bug fix cycles and is working reliably. **Isolated prompt testing is required before implementation** to validate that adding alternative selection does not degrade primary plan quality (exercise appropriateness, progressive overload accuracy, variety rules). ExerciseDB query (same target muscle + user's equipment - current day's exercises) serves as the fallback if pre-generated alternatives are unavailable or exhausted.

Evidence: [[I003](../research/Research-Findings-Report.md)] Contextual AI swap is Push's clearest differentiation — "AI-suggested" specifically recommended. [[F006](../research/Research-Findings-Report.md)] No app offers contextual mid-workout swap. [[F042](../research/Research-Findings-Report.md)] ExerciseDB endpoints support fallback queries. [[F037](../research/Research-Findings-Report.md)] 11,000+ exercises ensures catalog depth.

### Cluster C — "First impression"

**Decision 6: Onboarding scope**

6-step flow, reordered from the current implementation to follow personal → contextual → practical → safety: (1) About You — DOB + gender, (2) Experience level, (3) Goals, (4) Equipment, (5) Schedule, (6) Injuries (yes/no gate — if no, submit immediately; if yes, expand to body region selection or free text).

DOB and gender are collected first because they inform the AI's interpretation of all subsequent inputs. A "beginner" senior selecting "build_muscle" requires fundamentally different programming than a teenager with the same selections. Without demographic data, the AI cannot apply age-specific safety rules (senior intensity caps, under-18 compound movement limits) or gender-informed volume distribution.

Unit preference removed from onboarding — defaults to lb, changeable in Progress tab settings. Body weight, height, and body shape deferred to progressive profiling (body weight already collected at check-in; height and body shape are not used by the generation prompt today).

**Generation prompt impact:** Requires new demographic-aware rules: seniors (60+) get intensity caps, functional movement emphasis, and balance exercises; under-18 gets bodyweight/machine priority with limited heavy compounds; gender informs volume distribution. **Isolated prompt testing required** — same flag as Decision 5. Also requires schema migration: `date_of_birth` and `gender` columns on `user_settings`.

Evidence: [[R001](../research/Research-Findings-Report.md)] Progressive onboarding. [[I001](../research/Research-Findings-Report.md)] Onboarding validated by competitive analysis and AI research. [[F002](../research/Research-Findings-Report.md)] Best onboarding <2 min. [[F034](../research/Research-Findings-Report.md)] 4 inputs yield 80% plan — Push adds DOB, gender, injuries for full personalization and safety. [[I011](../research/Research-Findings-Report.md)] Special population safety requires hard-coded exclusion. [[F027](../research/Research-Findings-Report.md)] ACSM senior guidelines. [[R007](../research/Research-Findings-Report.md)] Injury exercise exclusion system.

## 9. Design Scope

### Resolved (Cluster A)

- Navigation pattern — persistent two-tab bottom nav (Workout + Progress)
- Historical performance — "Last" reference line + PR icon per exercise
- Rest day state — week summary + next workout preview + Week 1 cold start message
- Touch targets and accessibility — 44px, 16pt, 4.5:1

### Resolved (Cluster B)

- Exercise swaps — swipe-left trigger, inline expansion, 3 AI-pre-generated alternatives (requires isolated prompt testing before implementation)

### Resolved (Cluster C)

- Onboarding — 6 steps reordered (About You → Experience → Goals → Equipment → Schedule → Injuries). DOB + gender added. Unit preference moved to settings. Requires schema migration and prompt testing.

### Open (Pending)

- Set logging interaction — reduce taps-to-log, add quick-complete and swipe gestures
- Rest timer — between-set countdown with log prompt
- Check-in simplification — structured inputs over free text
- Offline resilience — log sets without connectivity, sync later
- Dual logging paths — quick-complete vs granular (described in product brief, undesigned)
- Progress tab — full design spec TBD

This document provides the full context needed to explore UX direction. All current screens, data models, navigation flows, design tokens, and known pain points are included. The codebase is SvelteKit + Svelte 5 on Vercel — any design that can be expressed in HTML/CSS/JS is implementable.