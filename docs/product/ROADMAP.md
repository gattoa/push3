# Push — POC Roadmap

> **Scope:** Prove the end-to-end feedback loop — Onboarding → Plan Generation → Workout Logging → Check-In → Re-Generation.
> Last updated: 2026-03-20 (Phase 4 complete)

---

## POC Objective

Validate that the core feedback loop produces progressively better workout plans as athlete data accumulates. The athlete provides inputs (onboarding, set logs, check-ins), the system generates a personalized plan, and each cycle refines the next. Every phase of this roadmap exists to complete or connect a piece of that loop.

### What "Done" Looks Like

An athlete can:
1. Onboard and receive a Week 1 plan (cold start — no target weights)
2. View their plan organized by day
3. Log sets against prescribed exercises throughout the week
4. Complete a check-in at end of week
5. Receive a Week 2 plan that reflects their logged performance and check-in data
6. See evidence that the plan adapted (target weights prescribed, exercises adjusted)

---

## POC Simplifications

These decisions reduce scope without breaking the loop:

| Full Product | POC Simplification | Rationale |
|---|---|---|
| Batch API (async) + synchronous fallback | Synchronous only | Loop must feel immediate to validate. Batch is a cost optimization, not a validation requirement. |
| Configurable check-in day | Fixed to Sunday | Simplifies week boundary logic. |
| Progress photos in check-in | Deferred | Photos are a secondary signal. The loop's primary inputs are set logs and check-in fields. |
| Equipment swaps mid-workout | Deferred | Differentiation feature, not part of the core loop. |
| PWA offline logging + sync | Online only | Feedback loop doesn't depend on offline capability. |
| Plan Review celebration UX | Minimal plan display | Prove the plan adapts; polish the delivery later. |
| Navigation pattern (TBD) | Simple route-based nav | No investment in nav design until loop is proven. |
| Dual logging paths (quick + granular) | Single logging path | One path that captures weight, reps, and completion per set. |

---

## Phase 0: Foundation & Auth ✅

**Goal:** Scaffold the app, configure auth, establish design system.
**Status:** Complete

### What Exists
- SvelteKit project with TypeScript strict mode and Svelte 5 runes
- Supabase integration (client factory, SSR helpers)
- Google OAuth login flow with server-side session management
- Auth callback route (`/auth/callback`)
- Animated login/landing page
- Global CSS with design tokens (dark theme)
- PWA manifest + service worker scaffold
- Fonts: Inter (body) + JetBrains Mono (display)

### Known Gaps to Address
- Adapter is `adapter-auto`; tech-stack specifies `@sveltejs/adapter-vercel` (deferred to Phase 5)
- PWA uses manual service worker; tech-stack specifies `@vite-pwa/sveltekit` (deferred to Phase 5)
- ~~`@anthropic-ai/sdk` not yet installed~~ → Installed in Phase 2
- ~~No protected route guard~~ → Auth guard added in `hooks.server.ts` (Phase 2)
- ~~No ExerciseDB instance exists yet~~ → Deployed in Phase 1
- ~~No Supabase schema exists yet~~ → Created in Phase 1

---

## Phase 1: Data Model & ExerciseDB ✅

**Goal:** Stand up the Supabase schema and self-hosted ExerciseDB so all subsequent phases have a data layer and exercise catalog to build against.
**Status:** Complete

### Deliverables

#### Supabase Schema
- [x] `user_settings` table — goals, equipment list, injuries, experience level, session duration, training days, unit preference (lb/kg)
- [x] `weekly_plans` table — plan metadata per user per week (week_number, status, created_at)
- [x] `planned_days` table — 7 days per plan with split labels (Push, Pull, Legs, Rest, etc.)
- [x] `planned_exercises` table — exercises assigned to each day (exercise_id, order, notes)
- [x] `planned_sets` table — prescribed sets with target reps and target weight (nullable for cold start)
- [x] `set_logs` table — actual performance: reps, weight, completed/skipped, logged_at
- [x] `check_ins` table — weekly check-in data: body weight, injury changes, equipment changes, notes
- [x] Row Level Security (RLS) policies on all tables
- [x] Auto-create `user_settings` row on auth.users insert (trigger)
- [x] Postgres RPC functions: `get_full_plan` (plan → days → exercises → sets → logs) and `get_generation_context` (full generation inputs)
- [x] **No data deletion on week rollover.** All set logs, plans, and check-ins are retained indefinitely.

#### ExerciseDB
- [x] Fork and deploy ExerciseDB v1 to Vercel as a separate project (`exercisedb-api-khaki.vercel.app`)
- [x] Verify API endpoints: query by muscle group, query by equipment, query by exercise ID
- [x] Confirm GIF and instruction data is served correctly
- [ ] Configure Vercel edge caching (`s-maxage=300, stale-while-revalidate`) — using Vercel defaults; explicit config deferred

### Dependencies
- Supabase project must be provisioned (exists from Phase 0)
- Vercel account for ExerciseDB deployment

### Exit Criteria
- All tables created with RLS enforced
- RPC returns a complete plan object in a single call
- ExerciseDB is live and queryable from the SvelteKit app

---

## Phase 2: Onboarding & First Plan Generation ✅

**Goal:** Athlete completes onboarding, system generates Week 1 plan (cold start), athlete sees their plan. This is the first half of the loop.
**Status:** Complete

### Deliverables

#### Onboarding Flow
- [x] Onboarding route (`/onboarding`) — 6-step form with progress bar
- [x] Collect: goals, experience level, equipment available, training days per week, session duration, unit preference, injuries
- [x] Save to `user_settings` on completion
- [x] Redirect to plan generation on submit (`/plan/generate`)

#### Plan Generation (Server-Side)
- [x] SvelteKit API route for plan generation (`/api/generate-plan`)
- [x] Context assembly: `get_generation_context` RPC + ExerciseDB (filtered by equipment)
- [x] System prompt: coaching rules, constraints, output format (structured JSON via tool use)
- [x] Claude API call (synchronous) with `@anthropic-ai/sdk`
- [x] Validate returned plan against exercise catalog (exercise ID check, 7-day check)
- [x] Save plan to Supabase: `weekly_plans` → `planned_days` → `planned_exercises` → `planned_sets`
- [x] Week 1 plans prescribe no target weights (cold start per architecture decision)
- [x] Generation throttle: one plan per user per week (unique constraint on user_id + week_number)

#### Plan View
- [x] Plan route (`/plan`) — displays current week's plan
- [x] 7-day layout with day tabs and exercise lists
- [x] Each exercise shows: name, sets × reps, target weight (or "—" for cold start)
- [x] Day detail via inline tab selection (functionally equivalent to separate day routes)

#### Additional (not in original spec)
- [x] Auth guard in `hooks.server.ts` — redirects based on authentication and onboarding status
- [x] Generation loading page (`/plan/generate`) with error handling and retry
- [x] Auth callback redirects through hooks for proper routing

### Dependencies
- Phase 1 (schema + ExerciseDB must be live)

### Exit Criteria
- New user can onboard, trigger generation, and see a Week 1 plan with exercises appropriate to their profile
- Plan has no target weights (cold start)
- Plan is persisted in Supabase and survives page refresh

---

## Phase 3: Workout Logging ✅

**Goal:** Athlete logs actual performance against their prescribed plan. This produces the data that makes the next plan smarter.
**Status:** Complete

### Deliverables

#### Daily Workout View
- [x] Workout route (`/workout/[day]`) — shows today's prescribed exercises
- [x] Exercise list with prescribed sets, reps, and target weight
- [x] For cold start exercises (no target weight): display input fields without a target

#### Set Logging
- [x] Per-set logging: actual weight, actual reps, completion status (completed / skipped)
- [x] Save each set log to `set_logs` table immediately on entry (via `/api/log-set` upsert endpoint)
- [x] Visual feedback on completion (set marked done — row highlights green, skip dims row)
- [ ] Historical indicator: when an exercise has prior logged data, show last performance for reference — **deferred; baselines available in generation context but not yet surfaced in workout UI**

#### Session State
- [x] Active workout persists across page refresh (read from Supabase via `get_full_plan` RPC, not local state)
- [x] Workout summary on day completion: total sets completed, total volume, skipped count

### Dependencies
- Phase 2 (plan must exist to log against)

### Exit Criteria
- Athlete can open a workout day, log weight and reps for each set, and see their data persisted
- `set_logs` in Supabase accurately reflect prescribed vs. actual for every set

---

## Phase 3.1: UX Refinements ✅

**Goal:** Shift navigation from plan-first to daily-first. The workout screen becomes the home screen; the plan view becomes a secondary weekly agenda.
**Status:** Complete

### Deliverables

- [x] `/workout` is now the home screen (today's workout), redirected to from `/` after auth
- [x] `/plan` redesigned as weekly agenda with day cards, mini progress bars, completion indicators
- [x] `/exercise/[id]` detail page with GIF, instructions, target muscle, equipment
- [x] Navigation: workout → plan (via hamburger icon), plan → workout ("← Today" link)
- [x] Design documentation: `docs/design/README.md`, `daily-workout.md`, `weekly-agenda.md`, `exercise-detail.md`
- [x] Auth guard in `hooks.server.ts` updated to redirect to `/workout` (not `/plan`)

---

## Phase 4: Check-In & Re-Generation ✅

**Goal:** Athlete completes end-of-week check-in, system generates Week 2+ plan using all accumulated data. The loop closes.
**Status:** Complete

### Deliverables

#### Check-In Flow
- [x] Check-in route (`/check-in`) — end-of-week form with week summary stats
- [x] Collect: current body weight, injury changes (new/recovered), equipment changes, preference adjustments (free-text notes)
- [x] Save to `check_ins` table (historical record)
- [x] Update `user_settings` with current state (injuries, equipment)
- [x] Trigger plan generation on submit (marks current plan as `completed`, redirects to `/plan/generate`)

#### Informed Plan Generation (Week 2+)
- [x] `/api/generate-plan` context assembly includes (via `get_generation_context` RPC):
  - This week's `set_logs` (prescribed vs. actual for every set)
  - Historical `set_logs` from prior weeks (per-exercise baselines and trends)
  - `check_ins` history (weight trend, injury timeline)
  - Previous `weekly_plans` (for adherence analysis)
- [x] Claude receives the full context per the architecture plan
- [x] System prompt includes explicit progressive overload rules (weight increase ranges per body region, handling of missed reps, exercise swaps for poor adherence)
- [x] Latest check-in notes surfaced prominently in user message for AI coach to factor in
- [x] Week 2+ plans prescribe target weights for exercises with established baselines
- [x] New exercises introduced still have no target weight until baseline is logged (system prompt rule 4)

#### Plan Generation State
- [x] Loading state after check-in submit (reuses `/plan/generate` page — "Building your plan...")
- [x] Redirect to plan view when generation completes
- [x] Error handling if generation fails (retry option, clear error message)

#### Loop Verification
- [ ] Week 2 plan demonstrates adaptation — **requires live testing (not code-verifiable); infrastructure is in place**
- [x] All data from Week 1 (set logs, check-in) is visible in the generation context (via `get_generation_context` RPC)

#### Navigation (added in Phase 4)
- [x] Check-in link in weekly plan view header (`/plan` → "Check-In →")
- [x] Check-in CTA in workout complete summary card (`/workout` → "Weekly Check-In")

### Dependencies
- Phase 3 (set logs must exist for informed generation)

### Exit Criteria
- Athlete completes check-in, receives Week 2 plan, and the plan visibly reflects their Week 1 performance
- Target weights appear on exercises that were logged in Week 1
- The full data chain is intact: onboarding → plan → logs → check-in → new plan

---

## Phase 5: Loop Polish & Validation

**Goal:** Refine the end-to-end experience, fix gaps discovered during testing, confirm the loop holds across multiple cycles.
**Status:** Not Started

### Deliverables

#### Scaffolding Alignment
- [ ] Swap `adapter-auto` → `@sveltejs/adapter-vercel`
- [ ] Evaluate migrating manual service worker to `@vite-pwa/sveltekit` (or defer to post-POC)
- [x] Protected route guard: redirect unauthenticated users to `/` (completed in Phase 2)
- [ ] `/auth/error` page for OAuth failures

#### Multi-Week Validation
- [ ] Run through 3 complete weekly cycles with test data
- [ ] Verify plan quality improves with accumulated data
- [ ] Verify historical set logs accumulate correctly (no data loss on week rollover)
- [ ] Verify check-in history builds over time

#### Edge Cases
- [ ] Athlete skips entire workout days — next plan accounts for missed volume
- [ ] Athlete partially completes sets — partial data feeds generation correctly
- [ ] Athlete changes equipment or reports new injury at check-in — next plan respects constraints
- [ ] First-time exercise in Week 2+ plan — no target weight until baseline established

#### Error Handling
- [ ] Claude API failure: graceful error with retry
- [ ] Supabase write failure: user-facing error, no silent data loss
- [ ] ExerciseDB unreachable: fallback or clear error

### Dependencies
- Phase 4 (complete loop must exist)

### Exit Criteria
- 3 consecutive weekly cycles complete without data loss or generation failures
- Plans demonstrably improve across cycles
- All edge cases handled without breaking the loop

---

## Schema Reference

From architecture-plan-generation.md (source of truth):

```
user_settings
├── user_id (uuid, FK → auth.users)
├── goals, equipment, injuries, experience_level
├── session_duration, training_days, unit_pref
└── updated_at

weekly_plans
├── id, user_id, week_number, status, created_at

planned_days
├── id, plan_id, day_index, split_label

planned_exercises
├── id, day_id, exercise_id, order_index, notes

planned_sets
├── id, exercise_id (FK → planned_exercises), set_number
├── target_reps, target_weight (nullable)

set_logs
├── id, planned_set_id (FK → planned_sets)
├── actual_reps, actual_weight, status (completed/skipped)
├── logged_at

check_ins
├── id, user_id, week_number
├── body_weight, injury_changes, equipment_changes, notes
├── created_at
```

---

## What's Deferred (Post-POC)

| Feature | Why Deferred |
|---|---|
| Batch API + plan-ready notification | Cost optimization; synchronous proves the loop |
| Progress photos | Secondary signal; not required for plan quality validation |
| Equipment swaps mid-workout | Differentiation feature; not part of core loop |
| PWA offline + background sync | Infrastructure concern; loop works online-only |
| Plan Review celebration UX | Polish; POC validates adaptation, not presentation |
| Dual logging (quick + granular) | UX refinement; single path captures required data |
| Configurable check-in day | Simplification; fixed Sunday boundary |
| ~~Navigation pattern design~~ | ~~TBD~~ → Addressed in Phase 3.1 (daily-first navigation) |
| ~~ExerciseDB GIFs in exercise detail~~ | ~~Nice-to-have~~ → Addressed in Phase 3.1 (`/exercise/[id]` page with GIFs) |
| AI rationale captions | Polish; not required to prove the loop |
