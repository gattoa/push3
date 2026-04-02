# Exercise Detail — `/exercise/[id]`

> Reference page. Shows exercise instructions, demonstration, and muscle targets.

## Role

Lets athletes learn how to perform an exercise correctly. Accessed by tapping an exercise name on the daily workout view. This is a read-only reference page — no logging or inputs.

## Layout

```
┌─────────────────────────────────┐
│                               │
│   [←]     Bench Press          │  ← Header: back btn + title only
│                               │
│  Barbell · Chest               │  ← Equipment · target (tab content)
│  Secondary: Triceps, Delts     │  ← Secondary muscles (muted)
│                               │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │       Exercise GIF        │  │  ← Full-width
│  │                           │  │
│  └───────────────────────────┘  │
│                               │
│  Instructions                  │  ← Section header
│                               │
│  1. Lie flat on the bench      │  ← Semantic <ol> with styled markers
│     with feet on the floor.    │
│                               │
│  2. Grip the bar slightly      │
│     wider than shoulder width. │
│                               │
│  3. Unrack and lower the bar   │
│     to mid-chest.              │
│                               │
│  4. Press up to full lockout.  │
│                               │
└─────────────────────────────────┘
```

## Design Decisions

### Header (grid: back button + title)
- The header uses a two-column CSS grid (`44px + 1fr`) with the back button and exercise name vertically centered on the same row
- **Back button** in the left column (44px)
- **Name:** Display font (`--text-xl`, `--weight-bold`), in the right column — anchors the page immediately on arrival
- The header contains only the back button and title — nothing else. This keeps it stable when tabs are added (post-POC)

### Exercise GIF (full-width)
- Animated GIF from ExerciseDB, full-width below the header
- Constrained to `aspect-ratio: 1` with `object-fit: contain`
- Rounded corners matching card radius (`--radius`)
- Surface background behind GIF as fallback while loading

### Detail Sections

Three consistently styled sections below the GIF, each with an uppercase `section-title` header and separated by a subtle top border:

Two tiers of content hierarchy below the GIF:

**Metadata group (secondary)** — Muscles and Equipment displayed side-by-side as compact metadata blocks. Quiet labels (`--text-xs`, `--color-text-tertiary`, uppercase) with values in `--text-sm`. No borders, no heavy chrome. Visual weight is proportional to informational importance — these are supporting context, not primary content.

- **Muscles** — primary target muscle, with secondary muscles listed below in smaller muted text. Only shows secondary line if data exists.
- **Equipment** — what the exercise requires (e.g. "Barbell").

**Instructions (primary section)** — the main content of the page. Full-width section with top border, uppercase `--text-sm` header, and semantic `<ol>` with `--color-activity` markers in `--font-mono`. Gets the heaviest visual treatment because it's what the user came here for.

All content below the header is the future **Overview** tab content. The grid is scoped to the header only — metadata and instructions use standard block layout.

**Title-first rationale:** Users arrive by tapping a known exercise name from the workout view. The title provides instant navigation confirmation before the user commits attention to the GIF. In a gym environment with divided attention (R014, F031), label-before-content reduces cognitive load (Dual Coding Theory, Paivio 1986; NNGroup sequential processing research). The "hero media first" pattern is better suited to browsing/discovery contexts, not reference-lookup flows.



### Accessibility & Brand Compliance
- **Back button:** 44×44px touch target (R014, F030), Lucide `ChevronLeft` icon, `aria-label="Go back"`
- **Minimum font size:** `--text-sm` (0.875rem/14px) floor for metadata, `--text-base` (1rem/16px) for instructions (F031)
- **All values use design tokens** — spacing (`--space-*`), font sizes (`--text-*`), radii (`--radius-*`), transitions (`--duration-*` + `--ease-*`)
- **Entrance animations:** Staggered `push-up` animation on header, metadata, GIF, and instructions (brand motion language)
- **PWA:** `-webkit-tap-highlight-color: transparent` on interactive elements
- **Button press feedback:** `scale(0.95)` on `:active` (brand "push" language)

### Data Loading
- Fetch full exercise detail from self-hosted ExerciseDB by `exercise_id` on page load
- The `exercise_id` is stored on `planned_exercises` — passed via the route param
- Lightweight fetch — no plan data needed on this page
- `<title>` tag capitalizes exercise name programmatically (ExerciseDB returns lowercase)

## States

| State | Description |
|---|---|
| **Loaded** | GIF, metadata, and instructions all rendered. |
| **Loading** | Skeleton/placeholder while ExerciseDB responds. |
| **Error** | ExerciseDB fetch failed. Show exercise name (from plan data) with "Details unavailable" message. |

## Routing

- `/exercise/[id]` where `[id]` is the ExerciseDB exercise ID
- Back navigation returns to referring page (browser history — no explicit route needed)
- Exercise name on daily workout view becomes a link: `<a href="/exercise/{exercise_id}">`

## Future Considerations (Post-POC)

- [ ] Tabbed navigation: "Overview" (current content — GIF, equipment, muscles, instructions) + "History" (athlete's logged performance over time). Header (back button + title) stays stable above the tab bar. Current section structure slots into Overview tab with zero changes.
- [ ] Related exercises or substitution suggestions
- [ ] Video instead of GIF for higher quality demos
