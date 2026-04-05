# Week 0 Baseline Check-In — Tradeoff Analysis

## The Vision (From Product Docs)

Per `product-brief.md`:
> **Baseline photos at onboarding** — establishes a starting point for the AI
> **Weekly photo uploads on review day** — secondary signal for programming adjustments (tracked progress is always the primary data source)

Per `ROADMAP.md`:
> Progress photos — Deferred. Photos are a secondary signal. Needs storage (Supabase Storage), upload UI, and privacy considerations.
> Body weight trend — Sparkline from `check_ins.body_weight`.

The intent is documented: **baseline photos + body weight at onboarding, recurring weekly photo uploads, trend analysis over time.** But these were deferred from the POC. The current onboarding collects no body stats.

---

## The Problem We're Actually Solving

Two intertwined issues:

1. **Immediate bug:** A stale `check_ins` row for week 1 is blocking the banner. We need to clean it up and understand how it got there.

2. **Deeper gap:** There's no immutable baseline of the athlete's starting state. `user_settings` is mutable — as soon as someone updates their equipment or injuries, the original baseline is lost. The AI trainer's long-term value depends on having reliable "where did you start vs. where are you now" signal.

The "week 0 check-in" idea is one possible solution to #2. Before implementing it, we need to decide: is this the right solution, and is it the right time?

---

## What Research Says

From the Research Findings Report:

### On Onboarding Minimalism
- **4 inputs yield 80% personalized plan** (goals, fitness level, equipment, schedule) — [F034]
- **77% of users drop within 3 days without engagement** — [F020]
- **Best onboarding achieves first workout in <2 minutes with 3–4 screens** — [F002]
- **Progressive profiling over 4 weeks improves personalization by 20–50% over static onboarding** — [F035]
- **Recommendation 1:** "Implement 4-screen progressive onboarding. Collect goals, fitness level, equipment, and schedule. Deliver first workout in <2 minutes. **Defer injuries and body stats to Week 1 progressive profiling.**"

### On Progress Signals
- **Exercise science:** progressive overload tracked via logged performance is the *primary* signal (Epley 1RM formula validated) — [F036]
- **Photos and body weight are secondary signals** — supporting, not primary
- Tracking-focused users are retained; visual-progress-focused users are more motivated by celebration

### The Tension
- Research says: **minimize onboarding to <2 min**, defer body stats to later
- Product vision says: **collect baseline at onboarding** for the AI trainer
- Current reality: **no body stats collected anywhere except optional weekly weight in check-ins**

---

## Three Paths Forward

### Path A: Do Nothing Now, Fix Only the Bug
**Scope:** Clean up the stale check-in record. Fix any UX gaps that are blocking users (e.g., manual check-in entry on `/plan`). Leave baseline/photos deferred as-is.

**Pros:**
- Smallest change, lowest risk
- Respects the research recommendation (minimize onboarding, defer body stats)
- Keeps POC scope intact
- Doesn't invest in infrastructure (Supabase Storage, upload UI) before validating core loop

**Cons:**
- Doesn't address the deeper "mutable baseline" problem
- The documented vision (baseline photos + weekly photos) remains unbuilt
- Long-term AI trainer value is limited without historical anchoring

### Path B: Minimal Week 0 Check-In (No Photos)
**Scope:** Create an implicit `check_ins` row with `week_number = 0` at the end of onboarding. Add a JSONB `baseline_snapshot` column capturing the onboarding data. No photos, no body weight yet. No banner, no UI — purely a data record.

**Pros:**
- Preserves immutable baseline for the data we already collect
- One schema migration, one table
- Small implementation cost (one new column, one createCheckIn call)
- Establishes the pattern for future baseline data (photos, body weight)
- Doesn't change onboarding UX or add friction

**Cons:**
- The most valuable baseline data (photos, body weight) isn't in the current onboarding flow
- "Snapshot of user_settings at time X" is partial value without the missing pieces
- Adds a column to `check_ins` that's only meaningful for one row per user
- Doesn't solve the original intent (visual progress tracking via photos)

### Path C: Add Baseline Collection Step After Onboarding
**Scope:** Add an optional post-onboarding step (between onboarding and first plan generation) that collects body weight and optionally an initial photo. Create the week 0 check-in record from this data. Requires Supabase Storage setup for photos.

**Pros:**
- Fulfills the documented product vision
- Establishes the baseline with actual baseline data (photos, body weight)
- Positions the app for the AI trainer's long-term value proposition
- Creates a clean separation: onboarding collects *requirements*, baseline step collects *starting point*

**Cons:**
- **Directly contradicts the research**: adds friction to onboarding, delays first workout
- Requires Supabase Storage setup, privacy considerations, upload UI
- Body weight and photos are voluntary — users may skip, reducing data value
- Significant scope increase; pushes out other work
- Photo storage has real costs (storage, bandwidth, potential moderation)
- Users who decline will still need the system to work without a baseline

---

## What The Data Actually Supports

The research is clear on two points that tension with each other:

1. **Onboarding should be minimal** (4 inputs, <2 min, defer body stats). The 77% drop-off in 3 days makes this non-negotiable for retention.

2. **The AI trainer benefits from long-term progress signals.** Logged performance is primary; photos and body weight are secondary but valuable.

The research does NOT support adding mandatory baseline photos/weight to onboarding. It *does* support progressive profiling — collecting additional context over the first few weeks as the user engages.

This suggests a fourth path the research actually validates:

### Path D: Progressive Baseline via First Check-In
**Scope:** Don't create a week 0 record at onboarding. Instead, make the **first real check-in** (end of week 1) do double duty: collect the user's current body weight (already supported), add optional photo upload at that point, and treat that as the effective baseline. Add a `baseline_snapshot` JSONB column on `check_ins` that captures the full state at their first check-in.

**Pros:**
- Aligns with "progressive profiling" recommendation
- Doesn't add friction to onboarding (protects retention)
- Users who reach their first check-in are already engaged — they're more likely to complete optional steps
- Photo upload UI can be built once, used everywhere (first check-in + recurring)
- Body weight field already exists on check_ins
- "Baseline = first real check-in" is a defensible mental model

**Cons:**
- No record exists until the user actually checks in
- User_settings values can still drift between onboarding and first check-in (mutable)
- Doesn't solve the immediate bug-adjacent problem of "we have no data point at onboarding"

---

## My Recommendation

**Ship Path A now. Plan for Path D next.**

Here's the reasoning:

1. **The immediate bug is blocking you right now.** Clean up the stale check-in, add a manual check-in entry point on `/plan` as a safety net, and unblock the loop. This doesn't require a schema change or new infrastructure.

2. **The week 0 baseline concept is valuable but not urgent.** The research is clear: minimize onboarding friction. Don't add baseline collection to onboarding — it directly contradicts the retention data.

3. **Path D is the research-aligned version of your vision.** The first real check-in is the right place to establish a baseline because:
   - The user has demonstrated engagement (they completed a week)
   - They've experienced the value loop once
   - Adding photo upload to an existing screen costs less than adding a new onboarding step
   - It's still an early-enough baseline to be useful for long-term tracking

4. **The stale check-in bug is a symptom of the check_ins table being used as both "trigger for regeneration" and "historical record."** These roles mostly overlap, but edge cases (dev data leftover, failed generations, manual testing) create drift. Before investing in baseline/snapshot logic, we should understand whether the table's dual role is the right design — or if "historical record" should be its own concept.

5. **Photos deserve their own discovery phase.** They're in the roadmap but marked "Needs storage, upload UI, and privacy considerations." Adding them via a week 0 record would be the smallest possible first step, but it's still non-trivial. They should be planned as a dedicated feature, not wedged into bug-fix work.

---

## Proposed Execution Order

### Immediate (this branch)
1. **Diagnose the stale check-in.** Check its `created_at` and `week_number`. Determine if it's from dev testing or a real bug.
2. **Clean it up.** Delete the stale row, reset the plan status to `active`, document the recovery steps.
3. **Add manual check-in entry on `/plan`.** Always-visible, enabled/disabled based on whether a check-in is actionable. Closes the "banner is a single point of failure" gap.
4. **Add the `plan-generating` banner state.** Post-check-in, pre-new-plan — so users aren't stuck.
5. **Fix the stale docs** (already done).

### Next (separate branch, separate discovery)
- **Baseline/progress tracking discovery.** Revisit the full vision:
  - When should baseline be collected?
  - What counts as "baseline" (body weight, photos, something else)?
  - How does Path D (first check-in as baseline) compare to alternatives?
  - What does the Supabase Storage + photo upload infrastructure look like?
  - What privacy/moderation considerations apply?
- This should be its own discovery doc, its own research review, and its own implementation plan.

### Deferred
- Moving skipped workouts to other days (from earlier discussion)
- Manual override UI (from earlier discussion)
- Progress photo feature
