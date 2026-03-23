# Push — Product Roadmap

> Last updated: 2026-03-23
>
> **POC** (Phases 0–5): Prove the end-to-end feedback loop. ✅ Complete.
> **MLP** (Phases 6+): Make the loop worth using daily. 🔄 Planning.

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

## Phase 4.1: Bug Fixes ✅

**Goal:** Fix bugs discovered during Phase 4 live testing that prevented the loop from functioning correctly.
**Status:** Complete

### Fixes

- [x] **ExerciseDB response mapping** — All exercise query functions (`getExercises`, `getExerciseById`, `getExercisesByBodyPart`, `getExercisesByEquipment`, `getExercisesByMuscle`) were returning raw API responses without `mapExercise()`. Raw field `exerciseId` mapped to `id: undefined`, causing deduplication to collapse 300 exercises into 1. Only `searchExercises` had the correct mapping. Fixed: all functions now apply `mapExercise()`.
- [x] **Check-in upsert** — `createCheckIn` used `insert`, which failed with a unique constraint violation when re-submitting a check-in for the same week. Fixed: changed to `upsert` with `onConflict: 'user_id,week_number'`.
- [x] **Check-in RLS policy** — `check_ins` table had SELECT and INSERT policies but no UPDATE policy, blocking the upsert. Fixed: added UPDATE policy.
- [x] **Generation prompt variety rules** — Added rules 12 (no exercise repetition within a week) and 13 (diverse movement patterns) to prevent Claude from assigning the same exercise everywhere.

---

## Phase 5: Loop Polish & Validation ✅

**Goal:** Refine the end-to-end experience and fix gaps discovered during testing.
**Status:** Complete — remaining validation items (multi-week cycles, edge cases) are ongoing MLP concerns, not POC blockers.

### Deliverables

#### Scaffolding Alignment
- [x] Swap `adapter-auto` → `@sveltejs/adapter-vercel` (runtime: `nodejs22.x`)
- [x] Protected route guard: redirect unauthenticated users to `/` (completed in Phase 2)
- [x] `/auth/error` page for OAuth failures — displays error reason from callback, links back to sign-in

#### Error Handling
- [x] Claude API failure: graceful error with retry
- [x] Supabase write failure: user-facing error, no silent data loss
- [x] ExerciseDB unreachable: request timeout (10s), per-equipment error isolation, clear error message

### POC Exit Criteria — Met
The POC proved the feedback loop works end-to-end: onboarding → generation → logging → check-in → informed re-generation. Multi-week quality validation and edge case hardening continue as part of MLP work.

---

# Minimum Lovable Product (MLP)

## MLP Objective

Transform the proven feedback loop into an app athletes want to use daily. The POC validated that the loop *works*; the MLP makes it *good* — polished enough to retain early users through their first month of training.

### What "Lovable" Means

An athlete can:
1. Onboard in under 2 minutes and receive a plan that feels personalized
2. Log workouts with minimal friction, seeing their history and progress as they go
3. Trust the AI coach — plans visibly adapt, weights progress, and exercises rotate intelligently
4. Complete the weekly cycle (train → check-in → new plan) without confusion or dead ends
5. See their progress over time — not just follow instructions blindly

---

## MLP Candidate Backlog

Features drawn from design specs, research recommendations, and gaps identified during the POC. **Not yet scoped or sequenced** — these are candidates to be prioritized into MLP phases.

### From Design Specs (designed but not built)

| Feature | Source Doc | Notes |
|---|---|---|
| Onboarding: DOB + gender, reordered flow | `onboarding.md` | Doc is ahead of code. Adds demographic-aware AI coaching. Requires new DB columns. |
| Exercise swaps | `daily-workout.md`, UX Brief Cluster B | Pre-generated alternatives, swap UI during workout. Key differentiator per research. |
| Historical performance display ("Last: weight×reps") | `daily-workout.md` | Data exists in generation context but not surfaced in workout UI. |
| PR icon on personal records | `daily-workout.md` | Visual celebration when athlete sets a new personal best. |
| Completion summary | `daily-workout.md` | Post-workout summary card when all sets are done. |
| Progress tab | Design README (nav architecture) | Referenced as second nav tab. No spec, no route, no code. **Needs a design spec.** |
| Banner system refinements | `daily-workout.md` | 48hr persistence, max-one-at-a-time arbitration, dismiss logic. |
| Plan review destination | `weekly-agenda.md` | Newly generated week preview before athlete starts training. |

### From Research Recommendations

| Feature | Research Finding | Notes |
|---|---|---|
| Week 1 critical engagement design | 77% drop within 3 days without engagement; Week 1 predicts 6-month retention | Optimize first-week experience: quick wins, encouragement, low friction. |
| Review Day (streak + celebration + preview) | Retention drivers: streak visibility, positive reinforcement, next-week anticipation | End-of-week experience beyond just the check-in form. |
| Autoregulated deloads | Exercise science: periodization and recovery signals | AI detects fatigue/plateau patterns, prescribes lighter weeks. |
| Injury exclusions in generation | Safety is make-or-break (LLM hallucination risk) | Current prompt mentions injuries but exclusion logic is basic. Needs robust filtering. |
| Calibrated celebrations | Fitness-level appropriate feedback | Beginner PRs ≠ advanced PRs. Avoid patronizing or unrealistic praise. |
| Accessibility standards | Inclusive design | Touch targets, contrast ratios, screen reader support. |

### From POC Simplifications (deferred but relevant to MLP)

| Feature | POC Rationale for Deferral | MLP Relevance |
|---|---|---|
| PWA offline + background sync | Loop works online-only | Gym environments have poor connectivity. Critical for daily use. |
| Configurable check-in day | Fixed Sunday simplified week boundary | Athletes train on different schedules. |
| Progress photos | Secondary signal | Visual progress is a major retention driver. |
| Dual logging (quick + granular) | Single path captures required data | Quick-complete for easy sets reduces friction. |
| Plan review celebration UX | POC validates adaptation, not presentation | First impression of the new plan matters for retention. |
| AI rationale captions | Not required to prove loop | "Why this exercise?" builds trust in the AI coach. |
| Service worker migration (`@vite-pwa/sveltekit`) | Manual SW was sufficient for POC | Proper PWA tooling needed for offline, caching, update prompts. |

### Technical Foundations (not user-facing but MLP-enabling)

| Item | Notes |
|---|---|
| Test coverage | Zero tests today. Set logging, generation, and check-in flows need at minimum integration tests. |
| API rate limiting | `/api/generate-plan` calls Claude with no throttling. Cost exposure risk at scale. |
| Input validation | API routes accept POST bodies without schema validation. |
| Analytics / telemetry | No way to measure engagement, retention, or plan quality. |

---

## MLP Phases

Sequencing principle: fix the front door first (easy win), then polish daily use, then land generation changes while the codebase is still close to current shape, then add new screens last (purely additive, lowest risk).

Each phase is independently branchable and deployable.

---

### Phase 6: Onboarding Overhaul

**Goal:** Align onboarding code to the design spec. Collect demographics for smarter AI coaching.
**Branch:** `feature/onboarding-overhaul`

| Deliverable | Source | Notes |
|---|---|---|
| DOB + gender fields | `onboarding.md` | New Step 1: date picker + gender chips. Requires DB migration (`date_of_birth`, `gender` columns). |
| Step reorder | `onboarding.md` | About You → Experience → Goals → Equipment → Schedule → Injuries |
| Remove unit preference step | `onboarding.md` | Default to `lb`. Changeable in Progress tab settings (Phase 9). |
| Injury yes/no gate | `onboarding.md` | Binary choice → expand if yes. If no → "Generate My Plan" immediately. |
| Demographic-aware generation prompt | `onboarding.md` | Seniors (60+): intensity caps, functional movement. Under-18: bodyweight/machine priority. Gender-informed volume. **Requires isolated prompt testing.** |

**Technical (threaded):**
- DB migration for new columns
- Type updates (`UserSettings`, `UserSettingsUpdate`)
- Input validation on onboarding form action

**Exit criteria:**
- New user completes onboarding in under 2 minutes
- DOB and gender are captured and persisted
- Generation prompt produces age/gender-appropriate plans (validated via prompt testing)
- Unit preference no longer appears in onboarding flow

---

### Phase 7: Workout Experience

**Goal:** Make the daily workout feel polished and informative — not just functional.
**Branch:** `feature/workout-polish`

| Deliverable | Source | Notes |
|---|---|---|
| Historical performance display | `daily-workout.md` | "Last: 135×8" below exercise name. Data exists in generation context — needs to be surfaced in workout UI. |
| PR detection and icon | `daily-workout.md` | Estimated 1RM via Epley formula. Compare against user's all-time best per exercise. Accent icon on the set row. |
| Completion summary card | `daily-workout.md` | Appears when all sets have status. Shows completed/skipped counts + total volume. CTA: "View Weekly Plan." |
| Banner system | `daily-workout.md` | Plan review banner (after generation) + check-in banner (on check-in day). 48hr persistence, max one at a time, dismiss logic. |

**Technical (threaded):**
- Input validation on `/api/log-set` (schema validation for set log payloads)

**Exit criteria:**
- Athlete sees their last performance for recurring exercises
- PR icon appears when a personal best is set
- Workout completion shows a summary card
- Banners appear at the right times and dismiss correctly

---

### Phase 8: Exercise Intelligence

**Goal:** Build trust in the AI coach by giving athletes control and transparency. Lands generation/schema changes while codebase is close to current shape.
**Branch:** `feature/exercise-intelligence`

| Deliverable | Source | Notes |
|---|---|---|
| Pre-generated swap alternatives | `daily-workout.md` | During plan generation, AI produces 3 alternatives per exercise. Stored in `planned_exercises.alternatives` (JSON array). |
| Swap UI | `daily-workout.md` | Swipe left on exercise card → inline expansion with 3 alternatives. Tap to replace. Sets reset. |
| Swap fallback | `daily-workout.md` | ExerciseDB query (same muscle + user equipment − current day exercises) if pre-generated alternatives unavailable. |
| AI rationale captions | Backlog | "Why this exercise?" — brief coach note per exercise. Stored during generation. |
| Injury exclusion hardening | Research | Robust filtering: exercises targeting injured body regions excluded at generation time, not just mentioned in prompt. |

**Technical (threaded):**
- Schema change: `planned_exercises.alternatives` column (jsonb)
- Schema change: `planned_exercises.rationale` column (text, nullable)
- Generation prompt updates for alternatives + rationale output
- API rate limiting on `/api/generate-plan`

**Exit criteria:**
- Every generated exercise has 3 pre-generated alternatives
- Athlete can swap an exercise mid-workout without leaving the screen
- AI rationale visible per exercise
- Injured body regions produce zero exercises targeting those areas

---

### Phase 9: Progress Tab & Navigation

**Goal:** Give athletes a reason to open the app on rest days. Surface their trajectory. Purely additive — new route, new UI, reads from existing data.
**Branch:** `feature/progress-tab`

| Deliverable | Source | Notes |
|---|---|---|
| Persistent bottom nav | `progress.md`, Design README | Two-tab bar: Workout + Progress. Visible on all authenticated routes. |
| Streak & summary section | `progress.md` | Consecutive completed weeks + all-time totals (workouts, volume). |
| Body weight trend | `progress.md` | Sparkline from `check_ins.body_weight`. Empty state for Week 1. |
| Personal records list | `progress.md` | Estimated 1RM per exercise (Epley). Top PRs sorted descending. "See all" expands full list. |
| Training calendar | `progress.md` | Month grid with trained/rest dots. Tap for mini-summary. |
| Settings page | `progress.md` | `/progress/settings` — unit preference, training days, session duration, sign out. |

**Technical (threaded):**
- Consider `get_progress_summary` RPC if client-side aggregation is slow
- Analytics: basic page-view tracking to measure engagement

**Exit criteria:**
- Bottom nav works across all routes, highlights active tab
- Progress tab loads with real data from existing tables
- Settings changes persist and take effect on next plan generation
- Cold start / empty states render gracefully

---

### Post-MLP Backlog

Features deferred beyond MLP. Revisit after Phase 9 based on user feedback and engagement data.

| Feature | Notes |
|---|---|
| PWA offline + background sync | Requires service worker migration (`@vite-pwa/sveltekit`). Critical for gym use but significant infrastructure work. |
| Configurable check-in day | Requires week boundary logic refactor. |
| Progress photos | Needs storage (Supabase Storage), upload UI, and privacy considerations. |
| Dual logging (quick + granular) | Quick-complete for easy sets. UX design needed. |
| Review Day experience | Streak celebration + next-week preview. Builds on Progress tab data. |
| Week 1 engagement design | Onboarding follow-up: first-workout encouragement, quick wins, guided experience. |
| Autoregulated deloads | AI detects fatigue/plateau patterns. Requires multi-week data analysis. |
| Calibrated celebrations | Fitness-level-appropriate feedback. Builds on PR system. |
| Plan review celebration UX | Polished new-plan reveal. Builds on banner system. |
| Accessibility audit | Touch targets, contrast ratios, screen reader support. |
| Batch API migration | Cost optimization for plan generation. |
| Test coverage | Integration tests for critical flows (logging, generation, check-in). |
| Analytics / telemetry | Measure engagement, retention, plan quality. |

---

## Schema Reference

From `architecture-plan-generation.md` (source of truth):

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
