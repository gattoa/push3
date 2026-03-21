# Weekly Check-In — `/check-in`

> End-of-week form. Closes the feedback loop between logging and re-generation.

## Role

The check-in captures how the athlete's week went and what's changed. It feeds the AI coach context for the next plan: body weight trends, injury updates, equipment changes, and free-text preferences. On submit, it marks the current plan as completed and triggers generation of the next week's plan.

## Layout

```
┌─────────────────────────────┐
│ ← Back    Week 1 Check-In   │  ← Header
├─────────────────────────────┤
│                              │
│  ┌─ Your Week ──────────────┐│
│  │  ┌──────┐  ┌──────┐     ││
│  │  │  3   │  │ 85%  │     ││  ← Stats grid (2×2)
│  │  │ Days │  │ Sets │     ││
│  │  ├──────┤  ├──────┤     ││
│  │  │8,400 │  │  2   │     ││
│  │  │Volume│  │ Skip │     ││
│  │  └──────┘  └──────┘     ││
│  └──────────────────────────┘│
│                              │
│  Body Weight (lb)            │
│  Optional — used for trends  │
│  ┌──────────────────────────┐│
│  │ e.g. 180                 ││
│  └──────────────────────────┘│
│                              │
│  Current Injuries            │
│  ┌──────────────────────────┐│
│  │ left shoulder, lower back││  ← Pre-filled from settings
│  └──────────────────────────┘│
│  What changed?               │
│  ┌──────────────────────────┐│
│  │                          ││  ← Textarea
│  └──────────────────────────┘│
│                              │
│  Available Equipment         │
│  ┌──────────────────────────┐│
│  │ dumbbell, cable, machines││  ← Pre-filled from settings
│  └──────────────────────────┘│
│  What changed?               │
│  ┌──────────────────────────┐│
│  │                          ││  ← Textarea
│  └──────────────────────────┘│
│                              │
│  Notes for Next Week         │
│  ┌──────────────────────────┐│
│  │ e.g. Traveling Thursday  ││  ← Free-text
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │  Submit & Generate Week 2││  ← Primary CTA
│  └──────────────────────────┘│
└─────────────────────────────┘
```

## Design Decisions

### Header
- **Left:** "← Back" — returns to `/plan`
- **Right:** "Week N Check-In" — current plan's week number

### Week Summary
- Computed server-side from the current plan's set logs
- 2×2 stats grid: days trained, sets completed %, total volume, sets skipped
- Gives the athlete a snapshot before they fill in the form

### Form Fields
- **Body weight:** Optional numeric input. Used for trend tracking across check-ins.
- **Current injuries:** Text input, pre-filled from `user_settings.injuries`. Comma-separated. Updated on submit.
- **Injury changes:** Textarea describing what changed (e.g., "Left knee feeling better"). Saved to `check_ins.injury_changes` for AI context.
- **Available equipment:** Text input, pre-filled from `user_settings.equipment`. Comma-separated. Updated on submit.
- **Equipment changes:** Textarea describing what changed. Saved to `check_ins.equipment_changes`.
- **Notes for next week:** Free-text textarea. Surfaced prominently in the AI generation prompt as "Athlete Notes."

### Submit Behavior
1. Upsert to `check_ins` table (allows re-submission for the same week)
2. Update `user_settings` with current injuries and equipment arrays
3. Mark current `weekly_plans` row as `completed`
4. Redirect to `/plan/generate` (triggers AI plan generation for next week)

## Entry Points

Users reach the check-in from two places:
- **Weekly agenda:** "Check-In →" link in the `/plan` header
- **Workout complete:** "Weekly Check-In" button in the completion summary card on `/workout`

## States

| State | Description |
|---|---|
| **Fresh** | Form loaded with pre-filled settings. No previous check-in for this week. |
| **Re-submit** | User already checked in this week. Upsert overwrites the previous record. |
| **Submitting** | Form disabled, button shows "Generating next week..." |
| **Error** | Server error banner at top of form. Form remains editable for retry. |

## Data Flow

```
check-in form → check_ins table (upsert)
              → user_settings (update injuries, equipment)
              → weekly_plans (mark completed)
              → /plan/generate → /api/generate-plan → Claude
              → /plan (new week)
```
