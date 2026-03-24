---
name: Design system shape and visual decisions
description: Push design system decisions — shapes, colors, typography, container language, motion
type: project
---

## Shape Language
- **Containers**: uniform 12px radius (cards, inputs, context panels)
- **Progress indicators**: arc/semi-ring — Push's signature shape, represents the bar path of a press
- **Badges/tags**: pill (full radius) — contrast with rectangular containers is intentional hierarchy
- **Buttons**: 8px radius (radius-md) — slightly tighter than containers
- **Brand mark**: barbell icon only, no arc addition

**Why:** The arc is reserved for progress moments — where you're measuring momentum. Restraint makes it meaningful. Pill badges don't conflict with uniform containers because they're different element types.

## Color System — Context-Driven
- No single primary color — each context owns its color
- Brand gradient blends activity → celebrate → reflect

### Color Semantics

| Color | Name | Hex | Meaning | When to use | When NOT to use |
|---|---|---|---|---|---|
| **Activity** | Mint | #2dd4a8 | Doing / on track / met expectations | Completed sets, active exercise, progress that's on plan | Don't use for achievements — that's Celebrate |
| **Rest** | Slate Blue | #64a1f4 | Prescribed recovery | Rest timers, rest days, deload weeks | Not a workout outcome — don't use in progress bars or set states |
| **Celebrate** | Gold | #e8b931 | Achievement / exceeded expectations | PR sets, exercise PRs, zero-skip workout completion, milestones | Not for routine completion — completing a set as prescribed is Activity, not Celebrate. Gold must stay rare to stay meaningful. |
| **Reflect** | Lavender | #a78bfa | Pause and think | Check-in banner, check-in form, weekly review, journaling | Not a workout state — never appears in set rows or progress bars |
| **Danger** | Rose | #f27a7a | Deviation from plan | Skipped sets, skipped exercises, delete actions, errors | Not "bad" — a skip is a data point the AI coach uses. Don't use for low performance (that's still Activity). |

### Applied to Workout States

**Set row outcomes:**
- Completed (met prescription) → Activity (mint) background tint
- PR (exceeded personal best) → Activity tint + Celebrate (gold) PR badge
- Skipped → Danger (rose) skip chip, struck-through target, muted row
- Pending → No color, default surface

**Exercise tile states:**
- Completed (all sets resolved) → Dimmed card, grey check badge. If exercise had a PR → Celebrate (gold) check badge + "New PR" label
- Active (first with pending sets) → Prominent card, Activity (mint) glow-from-within
- Upcoming (not yet started) → Default card, no glow

**Progress bar segments** (ordered by exercise sequence):
- Mint segments = completed sets (met prescription)
- Gold segments = PR sets (exceeded personal best)
- Red segments = skipped sets
- Grey track = pending sets

**Summary card:**
- Appears only when all sets have an outcome (no pending)
- Title and accent in Celebrate (gold) — completing a workout is an achievement
- PR count highlighted in Celebrate
- Skipped count in default text (not red — the bar already told that story)

### Guiding Principle
Mint is the workhorse — most of a good workout is mint. Gold is the reward — rare, earned, meaningful. Red is a signal, not a judgment. Blue and lavender live outside the workout flow.

## Container Language — Glow-from-Within
- Dark surface background + thin border (consistent everywhere)
- Color comes through: colored text/icons, subtle bottom glow shadow
- No left stripes, no tinted fills, no colored borders
- Hover intensifies the bottom glow
- Bottom glow alpha values: ~0.05 resting, ~0.10 hover

## Typography
- **Manrope** everywhere (display + body) — one font family
- **JetBrains Mono** for timers/counters only
- Type scale: minor third (1.2 ratio), 2xs through 4xl

## Warm Neutrals
- All surfaces warm-tinted (subtle amber undertone, not pure gray)
- Text is warm white (#f7f5f0) not pure white
- Makes the app feel human and inviting

## Motion — "Push" Language
- Elements enter by pushing upward (translateY animation)
- Staggered reveal timing (80ms per element)
- Buttons press down on :active (physical push feedback)
- Progress arcs animate their fill on load
- Brand glow drifts slowly (breathing)

## Mood
- **Vibrant Momentum** — expressive, rewarding, alive
- Athletic but approachable, welcoming, transformative
- Premium without being cold

**How to apply:** Use these decisions when building any new UI in Push. The design system preview page at `/design-system` is the reference.
