# Push — Plan Generation Architecture

## Overview

Push is a weekly workout planning app. Each week, a plan generator produces a personalized training plan for the athlete based on their profile, historical performance, check-in data, and progress photos. The system becomes progressively smarter as it accumulates data about the athlete over time.

---

## The Weekly Cycle

### 1. Execution Phase (Monday → Sunday)

The athlete follows their prescribed plan. For each set of each exercise, they log:

- **Actual reps** performed
- **Actual weight** used
- **Completion status** (completed or skipped)

This produces the raw performance data for the week — what was prescribed vs. what was achieved, per exercise, per set.

### 2. Check-In Phase (End of Week — configurable day)

Before the next plan generates, the athlete completes a weekly check-in:

- **Body shot photos** (optional) — stored for longitudinal visual progress tracking
- **Weight update** — current body weight
- **Injury changes** — new injuries or recovered injuries
- **Equipment changes** — new or lost access to equipment
- **Other preference adjustments** — goals, training days, session duration, etc.

Check-in data is persisted to the athlete's profile and check-in history. The check-in day is configurable per user (default: Sunday).

### 3. Generation Phase (triggered by check-in)

The plan generator runs **once per user per week**. It receives the full picture:

| Input | Description |
|---|---|
| **Current user profile** | Post-check-in settings: goals, equipment, injuries, experience level, session duration, training days |
| **This week's set logs** | Actual performance vs. prescribed targets for every set of every exercise |
| **Check-in history** | Body weight trend, injury timeline, photo history across all weeks |
| **Historical set logs** | Performance data from all prior weeks — per-exercise baselines and progression trends |
| **Previous plan(s)** | What was prescribed in prior weeks, enabling adherence analysis (skipped exercises, failed movements, completion rates) |

> **Schema note:** During check-in, athlete-submitted data (weight, injuries, equipment changes, preference adjustments) updates `user_settings` in place to reflect current state. The same data is also appended to `check_ins` to preserve historical context for trend analysis. `user_settings` represents "who the athlete is now"; `check_ins` represents "how they've changed over time."

The generator produces next week's plan: adjusting target weights where baselines exist, swapping exercises that showed poor adherence or stalled progress, modulating volume based on recovery signals, and progressively overloading where the athlete is trending upward.

---

## Cold Start vs. Informed Generation

### Week 1 — Cold Start (Baseline Gathering)

No performance history exists. The plan prescribes exercises with **no target weights** (or very conservative placeholders). The athlete's primary job in Week 1 is to log what they actually lift — this data becomes their baseline.

For any exercise without an established baseline, the system leaves target weight unset and relies on the athlete to log their working weight.

### Week 2+ — Informed Generation

The generator now has real data. Its behavior differs based on data availability:

- **Exercises with established baselines:** Prescribe target weights based on historical performance and progression trends (e.g., "you benched 135x8 last week, try 140x8 this week").
- **New exercises introduced into the plan:** Default to no target weight until the athlete establishes a baseline through logging.
- **Exercises with stalled progress or poor adherence:** May be swapped for alternatives or have volume/intensity adjusted.

The generator's intelligence grows over time per-exercise, per-athlete. Each week of logged data refines future prescriptions.

---

## Current Architecture (Problems)

### Flow

```
Client (plan-generator.ts)
  → POST /api/exercisedb-catalog    [1-4 ExerciseDB API calls via RapidAPI]
  → POST /api/generate-plan         [1 Claude Sonnet API call with full catalog in prompt]
  → Save to localStorage + Supabase [5 sequential inserts]
```

### Issues

1. **ExerciseDB via RapidAPI is rate-limited (100 calls/day) and prohibits caching.** A full-gym user burns 4 calls per generation. At weekly cadence, the system caps at ~25 full-gym users total. This is a hard scaling ceiling.

2. **ExerciseDB is called at runtime on every generation.** The exercise catalog is essentially static reference data being fetched live on the hot path.

3. **The generator is stateless.** It receives only onboarding data + a fresh exercise catalog. It has zero awareness of previous weeks, set logs, check-in history, or progression trends. The feedback loop described above does not exist in the current implementation.

4. **Week rollover destroys history.** `getCurrentWeek()` calls `clearWeekData()` when the week changes, deleting the previous week's logs instead of archiving them for the generator.

5. **Claude receives the entire exercise pool every call.** ~100 exercises with full metadata are embedded in the system prompt, inflating input token cost. Claude's job is constrained enough (fixed split patterns, fixed rep ranges, fixed set counts) that the selection could be deterministic.

6. **Supabase reads are waterfall.** `fetchCurrentPlan` makes 5 sequential queries (plans → days → exercises → sets → set_logs) that could be a single RPC call.

7. **No per-user generation throttling.** Any authenticated user can trigger plan generation (and the associated API costs) without limits.

---

## Architectural Decisions

### Decision 1: Self-Host ExerciseDB (AGPL-3.0)

**Decision:** Replace the RapidAPI ExerciseDB dependency with a self-hosted ExerciseDB instance.

**Rationale:** The RapidAPI wrapper imposed the 100 calls/day rate limit and no-caching policy — these are RapidAPI's constraints, not ExerciseDB's. The underlying ExerciseDB is open source under AGPL-3.0 and can be deployed to our own infrastructure. Self-hosting provides unlimited access to the full 1,300+ exercise library with GIFs, visual guides, instructions, and muscle data at zero per-call cost.

**AGPL compliance:** If the ExerciseDB API code is used as-is without modification, compliance is satisfied by linking to the source repository. If modifications are made to the ExerciseDB code itself, those modifications must be released under AGPL. The Push application code is unaffected.

**Impact:** Eliminates the scaling ceiling entirely. Exercise catalog queries become internal calls to our own infrastructure with no rate limits and no third-party dependency on the generation hot path.

### Decision 2: One Claude Call Per User Per Week

**Decision:** Use synchronous Claude API calls for plan generation (~$0.08/user/week at standard pricing).

**Rationale:** Claude's value is in coaching intelligence — interpreting performance trends, recognizing plateaus, adjusting programming based on adherence patterns, and reasoning about the athlete holistically. This justifies its cost only when fed rich historical context, not as a stateless template filler.

**Current implementation:** Plan generation uses the synchronous Claude API, triggered immediately when the athlete completes a check-in. The plan is generated in real-time and available within seconds.

**Future optimization:** The Claude Batch API (50% cost reduction) could be introduced later for users whose check-in timing allows a 24-hour processing window. This is deferred until scale justifies the added complexity of async job management and status polling.

**Estimated cost per call:**

| Prompt Section | Est. Tokens |
|---|---|
| System prompt (coaching rules, constraints, output format) | ~800 |
| Tool schema (`generate_plan` JSON schema) | ~800 |
| User profile (goals, equipment, injuries, experience, duration) | ~150 |
| Exercise catalog (~50-60 filtered exercises) | ~1,500 |
| This week's set logs (~48 sets, prescribed vs. actual) | ~1,500 |
| Historical summary (per-exercise baselines and trends) | ~2,000 |
| Check-in data (weight trend, injury changes) | ~200 |
| Previous plan (for adherence analysis) | ~800 |
| **Total input** | **~7,750** |
| **Total output** (7 days + ~18 exercises + ~54 sets as structured JSON) | **~3,500** |

**Cost at scale (synchronous API — standard pricing):**

| Users | Weekly | Monthly |
|---|---|---|
| 100 | $8 | $32 |
| 1,000 | $80 | $320 |
| 10,000 | $800 | $3,200 |

> **Future optimization:** Batch API would halve these costs. Deferred until user volume justifies the async infrastructure.

### Decision 3: History Is Never Destroyed

**Decision:** The app serves as a permanent data archive. Set logs, plans, check-ins, and photos are retained indefinitely.

**Rationale:** The generator's quality is directly proportional to the depth of historical data it can reason about. Destroying week data on rollover (as the current implementation does) eliminates the feedback loop that makes progressive plan refinement possible. Every week of logged data makes the next week's plan more informed.

### Decision 4: Context Assembled Server-Side

**Decision:** The server pre-assembles all generator inputs from Supabase in a single pass before making the LLM call.

**Rationale:** Reduces client complexity, minimizes network round trips, and ensures the LLM receives a consistent snapshot of the athlete's data. The client's only responsibility is to trigger generation (via check-in); the server handles data assembly, prompt construction, LLM invocation, validation, and plan storage.

**Assembly flow:**
```
1. User profile          ← Supabase: user settings (post-check-in)
2. Exercise catalog      ← Self-hosted ExerciseDB (filtered by equipment + injuries)
3. Current week logs     ← Supabase: set_logs for the completing week
4. Historical logs       ← Supabase: set_logs from prior weeks (rolling window)
5. Check-in history      ← Supabase: weight, injuries, photos over time
6. Previous plan         ← Supabase: last week's prescribed plan for adherence analysis
```

### Decision 5: Target Weights Are Earned, Not Guessed

**Decision:** Week 1 prescribes no target weights. Target weights are prescribed only once the athlete has established a baseline through logged performance data.

**Rationale:** The current system has Claude guess conservative starting weights with no data basis. This produces arbitrary numbers that erode athlete trust. By leaving target weights unset for new exercises, the athlete logs their actual working weight, establishing a real baseline. From Week 2 onward, the generator prescribes targets grounded in data — progressive overload recommendations derived from actual performance trends.

### Decision 6: Synchronous Generation on Check-In

**Decision:** Plan generation runs synchronously when the athlete completes their check-in. The plan is available immediately.

**Rationale:** Synchronous generation keeps the UX simple — the athlete checks in, sees a loading state, and receives their new plan within seconds. This eliminates the need for async job management, status polling, and edge-case handling around training day proximity. Batch API is a future cost optimization, not a current requirement.

---

## Target Architecture

### Target Flow

```
Weekly Check-In (athlete completes — configurable day)
  → Save check-in data to Supabase (photos, weight, settings changes)
  → Archive current week's set_logs (never delete)
  → Trigger plan generation

Plan Generation (once per week per user — synchronous)
  → Assemble full context server-side from Supabase + self-hosted ExerciseDB
  → Submit to Claude (synchronous API)
  → Validate returned plan against exercise catalog and constraints
  → Save new plan to Supabase

Athlete begins new week
  → Fetch current plan from Supabase
  → Log performance throughout the week
  → Cycle repeats at next check-in
```
