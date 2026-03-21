# Onboarding — `/onboarding`

> First-run setup. Collects the athlete's profile to generate their initial plan.

## Role

Onboarding is the entry point for new users after their first sign-in. It collects the minimum inputs needed for the AI coach to generate a meaningful Week 1 plan. The flow is a 6-step wizard with a progress bar. On completion, it saves to `user_settings` and redirects to plan generation.

## Layout

```
┌─────────────────────────────┐
│ ████████░░░░░░░░░░░░        │  ← Progress bar
│ Step 3 of 6                  │
├─────────────────────────────┤
│                              │
│  Available equipment?        │  ← Step title
│  Select everything you       │
│  have access to.             │  ← Step description
│                              │
│  ┌────────┐ ┌────────┐      │
│  │barbell │ │dumbbell│      │  ← Chip grid (multi-select)
│  ├────────┤ ├────────┤      │
│  │ cable  │ │machine │      │
│  ├────────┤ ├────────┤      │
│  │  body  │ │kettle- │      │
│  │ weight │ │ bell   │      │
│  └────────┘ └────────┘      │
│  ...                         │
│                              │
├─────────────────────────────┤
│  [Back]            [Continue]│  ← Navigation
└─────────────────────────────┘
```

## Steps

| Step | Field | Input Type | Required | Description |
|------|-------|-----------|----------|-------------|
| 1 | Goals | Single-select cards | Yes | `build_muscle`, `build_strength`, `lose_fat`, `general_fitness` |
| 2 | Experience level | Single-select cards | Yes | `beginner`, `intermediate`, `advanced` |
| 3 | Equipment | Multi-select chip grid | Yes (≥1) | 12 options: barbell, dumbbell, cable, machine, bodyweight, kettlebell, resistance band, ez barbell, smith machine, pull-up bar, bench, squat rack |
| 4 | Schedule | Chip selectors | No (defaults) | Days per week (2–6, default 4), session duration (30/45/60/75/90 min, default 60) |
| 5 | Unit preference | Two-option chip | No (default lb) | Pounds (lb) or Kilograms (kg) |
| 6 | Injuries | Textarea | No | Comma-separated free text. Optional. |

## Design Decisions

### Progress Bar
- Thin green bar at top, fills proportionally (step/6)
- Step counter below: "Step N of 6"

### Input Patterns
- **Single-select (Steps 1, 2):** Vertical card list. Each card shows label + short description. Selecting one deselects others. Accent border on selection.
- **Multi-select (Step 3):** Chip grid with wrap. Chips toggle on/off independently. Accent border + tint on selected.
- **Numeric chips (Step 4):** Horizontal chip row for days and duration. Single-select within each group.
- **Textarea (Step 6):** Standard text input with placeholder example.

### Navigation
- **Back:** Secondary button, left-aligned. Hidden on Step 1.
- **Continue:** Primary button, right-aligned. Disabled until required field is filled.
- **Final step:** Continue becomes "Generate My Plan" with loading spinner on submit.

### Validation
- Steps 1–3 require a selection before Continue enables
- Steps 4–6 have defaults or are optional — Continue always enabled

## Submit Behavior

1. All form state is held in Svelte `$state` variables
2. Hidden `<input>` fields persist values across steps (single `<form>` wrapping all steps)
3. On submit: SvelteKit form action saves to `user_settings` via `updateUserSettings()`
4. Redirect to `/plan/generate`

## Entry Points

- Authenticated users without equipment set (onboarding check in `hooks.server.ts`)
- Direct navigation to `/onboarding` (protected route — requires auth)

## States

| State | Description |
|---|---|
| **Step N** | Current step's content visible. Progress bar reflects position. |
| **Submitting** | Final step submit pressed. Button shows spinner + "Saving..." |
| **Error** | Form action returns error. User stays on Step 6 with error visible. |

## Routing

- Auth guard in `hooks.server.ts` checks `user_settings.equipment.length > 0`
- If equipment is empty (default `'{}'`), user is redirected to `/onboarding`
- After completion, redirect chain: `/onboarding` → `/plan/generate` → `/plan` → `/workout`
