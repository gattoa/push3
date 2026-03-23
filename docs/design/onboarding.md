# Onboarding — `/onboarding`

> First-run setup. Collects the athlete's profile to generate their initial plan.

## Role

Onboarding is the entry point for new users after their first sign-in. It collects the minimum inputs needed for the AI coach to generate a meaningful Week 1 plan. The flow is a 6-step wizard with a progress bar, ordered personal → contextual → practical → safety to mirror a natural trainer conversation. On completion, it saves to `user_settings` and redirects to plan generation.

## Layout

```
┌─────────────────────────────────┐
│ ████████░░░░░░░░░░░░            │  ← Progress bar
│ Step 4 of 6                      │
├─────────────────────────────────┤
│                                  │
│  Available equipment?            │  ← Step title
│  Select everything you   Select  │
│  have access to.           all ← │  ← Description + inline link
│                                  │
│  FREE WEIGHTS                    │  ← Group label (muted uppercase)
│  ┌────────┐┌────────┐┌────────┐ │
│  │barbell ││dumbbell││ez bar  │ │
│  └────────┘└────────┘└────────┘ │
│  ┌────────┐                      │
│  │kettle  │                      │
│  └────────┘                      │
│                                  │
│  MACHINES & CABLES               │
│  ┌────────┐┌────────┐┌────────┐ │
│  │ cable  ││machine ││ smith  │ │
│  └────────┘└────────┘└────────┘ │
│                                  │
│  STATIONS                        │
│  ┌────────┐┌────────┐┌────────┐ │
│  │ bench  ││squat   ││pull-up │ │
│  └────────┘│ rack   ││  bar   │ │
│             └────────┘└────────┘ │
│                                  │
│  OTHER                           │
│  ┌──────────────┐                │
│  │resistance    │                │
│  │  band        │                │
│  └──────────────┘                │
│                                  │
├─────────────────────────────────┤
│  [Back]              [Continue]  │
└─────────────────────────────────┘
```

## Steps

| Step | Field | Input Type | Required | Description |
|------|-------|-----------|----------|-------------|
| 1 | About You | DOB picker + single-select | Yes | Date of birth + gender (Male / Female / Prefer not to say). Collected first because demographics inform the AI's interpretation of all subsequent inputs — a beginner senior requires fundamentally different programming than a teenager. |
| 2 | Experience level | Single-select cards | Yes | `beginner`, `intermediate`, `advanced` |
| 3 | Goals | Single-select cards | Yes | `build_muscle`, `build_strength`, `lose_fat`, `general_fitness` |
| 4 | Equipment | Multi-select chip grid | Yes (≥1) | 11 options grouped: **Free weights** (barbell, dumbbell, ez barbell, kettlebell), **Machines & cables** (cable, machine, smith machine), **Stations** (bench, squat rack, pull-up bar), **Other** (resistance band). Bodyweight is auto-included server-side — not shown as an option (a body is not equipment). "Select all" link inline with step description. |
| 5 | Schedule | Chip selectors | No (defaults) | Days per week (2–6, default 4), session duration (30/45/60/75/90 min, default 60) |
| 6 | Injuries | Yes/no gate | No | "Do you have any current injuries or pain?" If no → submit immediately. If yes → expand to body region selection or free text. |

**Removed:** Unit preference (previously Step 5). Defaults to lb. Changeable in Progress tab settings.

**Ordering rationale:** Personal → contextual → practical → safety. About You is highest friction (most personal questions) so it goes first — getting it out of the way builds momentum. Experience before Goals because experience level contextualizes goal selection. Equipment and Schedule are practical/logistical. Injuries last as a safety gate — if the user has none, they skip straight to generation.

## Design Decisions

### Progress Bar
- Thin green bar at top, fills proportionally (step/6)
- Step counter below: "Step N of 6"

### Input Patterns
- **About You (Step 1):** DOB picker (date input or scroll wheels) + gender as single-select chips (Male / Female / Prefer not to say). Both required.
- **Single-select (Steps 2, 3):** Vertical card list. Each card shows label + short description. Selecting one deselects others. Accent border on selection.
- **Multi-select (Step 4):** Chip grid with wrap, organized into labeled groups (Free weights, Machines & cables, Stations, Other). Group labels are small uppercase muted text above each row. Chips toggle on/off independently. Accent border + tint on selected. "Select all" / "Deselect all" link right-aligned inline with the step description text. Bodyweight exercises are always included in the equipment array sent to plan generation — they are not presented as a selectable option.
- **Numeric chips (Step 5):** Horizontal chip row for days and duration. Single-select within each group.
- **Injuries (Step 6):** Yes/no binary choice. If "Yes," expand inline to body region selection or free-text textarea. If "No," the Continue button becomes "Generate My Plan" — submit immediately.

### Equipment Step (Step 4)
- **Bodyweight auto-included:** Bodyweight exercises (push-ups, pull-ups, dips, planks) are always included in the equipment array sent to plan generation. A body is not equipment — removing it from the selection eliminates a confusing option without losing functionality. Athletes who don't want specific bodyweight exercises can swap them during workouts (Phase 8).
- **Grouped chips:** Equipment is organized into 4 labeled groups (Free weights → Machines & cables → Stations → Other) for faster scanning. Order reflects gym familiarity — free weights first, niche items last.
- **Select all:** Right-aligned inline link on the same line as the step description. Toggles to "Deselect all" when all are selected. Most commercial gym users have access to everything — this saves 11 taps.
- **Goals are single-select:** Each goal drives fundamentally different training variables (rep ranges, volume, rest periods). Multiple goals create conflicting programming signals. "General Fitness" serves as the balanced multi-goal option. Primary + secondary goal selection deferred to post-MLP.

### Navigation
- **Back:** Secondary button, left-aligned. Hidden on Step 1.
- **Continue:** Primary button, right-aligned. Disabled until required field is filled.
- **Final step:** Continue becomes "Generate My Plan" with loading spinner on submit. On Step 6, this happens immediately if user selects "No" for injuries.

### Validation
- Steps 1–4 require a selection before Continue enables
- Steps 5–6 have defaults or are optional — Continue always enabled

## Submit Behavior

1. All form state is held in Svelte `$state` variables
2. Hidden `<input>` fields persist values across steps (single `<form>` wrapping all steps)
3. On submit: SvelteKit form action saves to `user_settings` via `updateUserSettings()`
4. Redirect to `/plan/generate`

## Schema Requirements

Decision 6 requires new columns on `user_settings`:
- `date_of_birth` (date) — from Step 1
- `gender` (text: 'male' | 'female' | 'prefer_not_to_say') — from Step 1

**Generation prompt impact:** Requires demographic-aware rules: seniors (60+) get intensity caps, functional movement emphasis, and balance exercises; under-18 gets bodyweight/machine priority with limited heavy compounds; gender informs volume distribution. **Isolated prompt testing required** before implementation.

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
