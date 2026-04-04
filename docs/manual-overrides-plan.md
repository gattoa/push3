# Manual Overrides — Discovery & Plan

## Problem Statement

Users occasionally do exercises that go untracked because:
1. The 3 swap alternatives don't include what they want (e.g., all barbell when they want cable)
2. The AI plan doesn't include cardio or core work, which users do on their own

Both lead to the same outcome: **work happens off-app, progress goes unrecorded.**

## Root Cause Analysis

The tracking gap is a **symptom of weak generation**, not a missing UI feature.

### Generation issues (primary)
- **Equipment bias**: The user-facing "machine" equipment option mapped to nothing in ExerciseDB (0 exercises). Users who selected machine got zero machine exercises in plans or alternatives.
- **No core work**: The prompt was entirely focused on compound lifts and isolation work. A real trainer always includes core.
- **No cardio/conditioning**: No mention of cardio in the prompt. For fat loss or general fitness goals, this is a significant gap.
- **Rigid rules**: The prompt was 19 numbered rules, not coaching guidelines. It didn't encourage the AI to adapt based on the athlete's actual data.

### Swap issues (secondary)
- **Stale alternatives after swap**: The rotation logic was creating entries with empty metadata (no body_part, target, equipment, gif_url). Each swap degraded the data further.
- **Shrinking pool**: The alternatives array shrunk on each swap, eventually leaving the user with 0-1 options.
- **Same-equipment alternatives**: The prompt allowed same-equipment suggestions (barbell alternatives for barbell exercises).

### Other bugs found
- GIF thumbnails on swap cards weren't rendering due to CSS opacity transition + backface-visibility compositing conflict in WebKit.

## What We Fixed

### Equipment mapping bug
- `"machine"` → `["leverage machine", "sled machine"]` — 109 exercises now available
- Applied the mapping consistently across plan generation, AI alternatives, and fallback swap alternatives

### Swap rotation
- Alternatives stored as fixed group of 4: `[self, B, C, D]` with full metadata (body_part, target, equipment, gif_url)
- Self-entry metadata pre-cached at generation time — zero network calls during swaps
- Array never shrinks — UI filters out the current exercise, always showing exactly 3 options
- Users can swap back to any previous exercise (corrects accidental taps)

### GIF thumbnails
- Removed opacity transition that conflicted with 3D flip card transforms

### Generation prompt rewrite
- Split into **Structural Requirements** (system constraints) and **Coaching Guidelines** (informed by athlete data)
- Added core work guidance (1-2 exercises on most training days)
- Added goal-dependent cardio (required for lose_fat, optional for hypertrophy)
- Added equipment variety guidance (use the athlete's full range of equipment)
- Reads as instructions to a real trainer, not a rigid rulebook

### Alternatives prompt
- Hard constraint: alternatives must use different equipment than the prescribed exercise

## Deferred

### Manual overrides (future, if needed)
If generation + alternatives improvements resolve most cases, manual overrides become low-priority. The two features that would matter:
- **"Add exercise" to a workout** — for genuinely unplanned work
- **"Search for more" on swap card** — single text link below the 3 AI picks

Both deferred until we validate whether the generation fixes solve the problem.

### Other future considerations
- Stretch/mobility programming (the ExerciseDB "assisted" category is mostly partner stretches — potentially useful for seniors or recovery-focused goals)
- `invalidateAll()` performance optimization after swaps

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-04 | Scope down from full override UI to generation fixes | The tracking gap is a symptom of bad recommendations, not missing UI. Fix upstream. |
| 2026-04-04 | Defer "Add Exercise" and search-in-swap | Can't justify UI complexity until we validate that better generation doesn't solve it. |
| 2026-04-04 | Cardio/core belong in plan generation | Users do this work — it should be prescribed and tracked like any other exercise. |
| 2026-04-04 | Fixed equipment mapping as highest priority | "machine" → 0 exercises was a data bug affecting every plan and every alternative for machine users. |
| 2026-04-04 | Alternatives are a fixed group of 4 | Enables infinite swaps within the group. User always sees 3 options. Can always swap back. |
| 2026-04-04 | Rewrite prompt as coaching guidelines, not rules | The AI should adapt to the athlete's data, not follow rigid prescriptions. User inputs from onboarding, logging, and check-ins are the drivers. |
