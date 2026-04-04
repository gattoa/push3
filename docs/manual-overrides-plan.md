# Manual Overrides — UX Plan

> The AI generates a plan. Manual overrides let the user make it *theirs*.  
> This is the core value proposition: AI coaching + human agency.

---

## Current State (What Exists)

| Override | Where | UX | Problem |
|----------|-------|-----|---------|
| **Swap exercise** | Workout page | Swipe exercise card left → pick from 3 AI alternatives | Hidden gesture — users don't know it exists. Limited to 3 options. |
| **Swap days** | Plan page → Edit mode | Tap day A, tap day B to swap | Unintuitive tap-tap pattern. Only swaps — can't move a workout to a rest day. |
| **Reorder exercises** | Workout page → Edit mode | Tap exercise A, tap exercise B to swap | Same tap-tap UX issue. |
| **Adjust next week** | Check-in page | Change training days, equipment, injuries, session duration | Only affects *next* plan. No way to fix *this* week. |

### Key Gaps

1. **No way to add an exercise** to a day
2. **No way to remove an exercise** from a day
3. **No way to add/remove sets** on an exercise
4. **No way to edit target weight/reps** before starting (can only override at log time)
5. **No free-text exercise search** for swaps — locked to 3 AI picks
6. **Swap exercise UX is hidden** — swipe gesture with no affordance
7. **No way to convert a training day ↔ rest day** for this week

---

## Proposed Solution

### Design Principle
**Long-press reveals, tap confirms.** Every editable element gets a contextual action sheet on long-press. No hidden swipe gestures, no abstract "Edit mode" toggles.

### Phase 1: Exercise-Level Overrides (Highest Impact)

The exercise card is where personalization matters most. Replace the hidden swipe-to-flip with a clear, accessible pattern.

#### 1A. Exercise Action Sheet (long-press or ⋯ button)

**Trigger**: Long-press on exercise card header OR tap a `⋯` (MoreVertical) icon that appears on the right side of each exercise card header.

**Actions presented in a bottom sheet:**

| Action | Icon | Description |
|--------|------|-------------|
| **Swap Exercise** | `ArrowLeftRight` | Opens exercise search/browse (replaces swipe-to-flip) |
| **Add Set** | `Plus` | Appends a new set copying the last set's targets |
| **Remove Last Set** | `Minus` | Removes the last unlogged set (disabled if all logged) |
| **Edit Targets** | `Pencil` | Inline-edits target weight/reps for all pending sets |
| **Remove Exercise** | `Trash2` | Removes exercise from today (with confirmation) |

#### 1B. Swap Exercise — Full Search

Replace the 3-alternative flip card with a proper search flow:

1. Tap "Swap Exercise" → **half-sheet slides up**
2. **AI Picks** section at top (the existing 3 alternatives, pre-cached)
3. **Search bar** below — free-text search against ExerciseDB
4. Results show: gif thumbnail, exercise name, target muscle, equipment
5. Tap to confirm swap → toast "Swapped to {name}"

This keeps the AI curation (best 3 picks) but adds escape-hatch search.

#### 1C. Add Exercise to Day

**Trigger**: "Add Exercise" button at the bottom of the exercise list on the workout page.

- Opens the same search half-sheet as swap
- After selecting an exercise, prompt for set count (default: 3) and target reps
- Inserts at the end of the day's exercise list
- New API endpoint: `POST /api/add-exercise`

### Phase 2: Set-Level Overrides

#### 2A. Edit Target Weight/Reps

Currently users can only type actual values at log time. Allow pre-editing targets:

- Long-press on a **pending** set row → targets become editable
- Or: the "Edit Targets" action from the exercise action sheet bulk-edits all pending sets
- Changes persist to `planned_sets` table (not just the log)

#### 2B. Add/Remove Sets

- **Add Set**: From exercise action sheet. Copies target_weight and target_reps from the last set. Creates a new `planned_set` row + `set_log` row.
- **Remove Set**: Only the last set, only if pending. Deletes the `planned_set` + `set_log` rows.

### Phase 3: Day-Level Overrides

#### 3A. Day Action Sheet

**Trigger**: Long-press on a day card in the plan view, or `⋯` icon on the day card.

| Action | Description |
|--------|-------------|
| **Move to…** | Pick a different day of the week (not just swap) |
| **Skip Day** | Mark as rest for this week (preserves the plan for display but dims it) |
| **Add Exercise** | Same search flow, scoped to this day |

#### 3B. Replace "Edit Mode" with Direct Manipulation

Remove the current "Edit" button + tap-to-select-tap-to-swap pattern. Instead:
- Day reordering → drag handle (or long-press + move) on day cards
- Exercise reordering → drag handle on exercise cards within a day

---

## Implementation Order

### Sprint 1 — Foundation + Exercise Actions
1. **`BottomSheet.svelte`** component — reusable half-sheet with backdrop, snap points, swipe-to-dismiss
2. **`ExerciseSearch.svelte`** component — search input + results list with ExerciseDB integration
3. **`ExerciseActionSheet.svelte`** — the action menu for exercises (swap, add set, remove set, edit targets, remove exercise)
4. Add `⋯` button to exercise card headers in `WorkoutSession.svelte`
5. Wire up "Swap Exercise" to new search flow (keep AI picks at top)
6. New API: `POST /api/add-exercise` — add exercise + sets to a planned day
7. New API: `DELETE /api/remove-exercise` — remove a planned exercise + its sets/logs
8. New API: `POST /api/add-set` — add a set to a planned exercise
9. New API: `DELETE /api/remove-set` — remove last pending set

### Sprint 2 — Set Editing + Day Actions  
10. Edit target weight/reps flow (long-press on set row)
11. `DayActionSheet.svelte` for plan page
12. "Move to" day picker
13. "Skip Day" toggle
14. New API: `PATCH /api/edit-targets` — bulk update target weight/reps
15. New API: `POST /api/skip-day` — mark day as skipped

### Sprint 3 — Polish + Remove Legacy
16. Remove swipe-to-flip gesture code
17. Remove tap-to-select Edit modes (plan page + workout page)
18. Add haptic feedback (navigator.vibrate) on long-press
19. Add undo support for destructive actions (remove exercise, remove set)
20. Onboarding tooltip: "Long-press any exercise for options"

---

## New Components

| Component | Purpose |
|-----------|---------|
| `BottomSheet.svelte` | Reusable bottom sheet with backdrop + swipe dismiss |
| `ExerciseSearch.svelte` | Search input + ExerciseDB results list |
| `ExerciseActionSheet.svelte` | Exercise-level action menu |
| `DayActionSheet.svelte` | Day-level action menu |

## New API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/search-exercises` | Free-text ExerciseDB search |
| `POST` | `/api/add-exercise` | Add exercise + default sets to a day |
| `DELETE` | `/api/remove-exercise` | Remove exercise + sets + logs |
| `POST` | `/api/add-set` | Add set to exercise |
| `DELETE` | `/api/remove-set` | Remove last pending set |
| `PATCH` | `/api/edit-targets` | Bulk update set targets |
| `POST` | `/api/skip-day` | Mark a day as skipped |

## Database Changes

- `planned_days` may need a `skipped` boolean column
- No other schema changes needed — all operations work with existing tables

---

## UX Principles

1. **Visible affordances** — No hidden gestures. Every action has a visible trigger (⋯ button, + button)
2. **Non-destructive by default** — Removing an exercise shows a confirmation. Adding is instant.
3. **AI + Human** — AI picks are always shown first (curated), but user can always search for anything
4. **This week, not next week** — All overrides apply to the current plan immediately
5. **Contextual, not modal** — Bottom sheets, not full-page modals. User stays oriented in their workout.
