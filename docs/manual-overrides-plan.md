# Manual Overrides — Discovery & Plan

## Problem Statement

Users occasionally do exercises that go untracked because:
1. The 3 swap alternatives don't include what they want (e.g., all barbell when they want cable)
2. The AI plan doesn't include cardio or core work, which users do on their own

Both lead to the same outcome: **work happens off-app, progress goes unrecorded.**

## Root Cause Analysis

The tracking gap is a **symptom of weak generation**, not a missing UI feature.

### Generation issues (primary)
- **Equipment bias**: No guidance in the system prompt to distribute exercises across equipment types. ExerciseDB catalogs skew barbell-heavy, so Claude picks more barbell movements.
- **No core work**: The prompt says "4-6 exercises per training day" with rules entirely focused on compound lifts and isolation work. A real personal trainer would include 1-2 core exercises.
- **No cardio/conditioning**: The prompt doesn't mention cardio finishers, LISS, or conditioning work at all. For goals like `lose_fat` or `general_fitness`, this is a significant gap.

### Alternatives issues (secondary)
- The alternatives prompt says "vary equipment across the 3 picks **where possible**" — soft guidance that Claude can ignore.
- The candidate catalog (`buildCandidateCatalog`) fetches 50 exercises per equipment type, which should provide variety, but Claude isn't being told strongly enough to use it.

### When it happens
- Mid-workout, between exercises. The user is deciding what to do next and the options don't match their preference.

## Solution: Fix Generation First

### Phase 1: Plan generation improvements

**System prompt changes (`generate.ts`):**

1. **Equipment distribution rule**: Add explicit instruction to vary equipment across the week. If the athlete has barbell, dumbbell, cable, and machine access, the plan should use all of them — not lean heavily on one type.

2. **Core work rule**: Add instruction to include 1-2 core exercises per training day (or at minimum on 2-3 days per week). Real trainers program core — the AI should too.

3. **Cardio/conditioning rule**: Goal-dependent:
   - `lose_fat`: Include a cardio finisher (10-15 min) on each training day
   - `general_fitness`: Include cardio 2-3x per week
   - `build_muscle` / `build_strength`: Optional, light cardio on rest days or as warmup
   
4. **Catalog balance**: The `trimCatalog` function already balances across body parts (5+ per group up to 80 total). Consider also balancing across equipment types so Claude has diverse options.

### Phase 2: Alternatives improvements

**Alternatives prompt changes (`alternatives.ts`):**

1. Change rule #3 from "Use varied equipment across the 3 picks **where possible**" to a hard constraint: "Each of the 3 alternatives MUST use a different equipment type than the prescribed exercise. At least one should use a different equipment category (e.g., if prescribed is barbell, include a cable or machine option)."

2. Add the prescribed exercise's equipment to the prompt context so Claude knows what to diversify away from.

### Phase 3: Manual overrides (future, deferred)

If generation + alternatives improvements resolve most cases, manual overrides become a low-priority edge case feature. The two features that would matter:

- **"Add exercise" to a workout** — for genuinely unplanned work. Simple button at bottom of exercise list, opens a quick-add flow.
- **"Search for more" on swap card** — single text link below the 3 AI picks, opens search. Only needed if 3 alternatives still miss after Phase 2.

Both deferred until we validate whether Phase 1 + 2 solve the problem.

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-04 | Scope down from full override UI to generation fixes | The tracking gap is a symptom of bad recommendations, not missing UI. Fix upstream. |
| 2026-04-04 | Defer "Add Exercise" and search-in-swap | Can't justify UI complexity until we validate that better generation doesn't solve it. |
| 2026-04-04 | Cardio/core belong in plan generation | Users do this work — it should be prescribed and tracked like any other exercise. |
