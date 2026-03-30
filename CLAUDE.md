# Push — Design System & Codebase Rules

> Figma-to-code integration guide for the Push workout tracker.

## Stack

- **Framework**: SvelteKit 2 + Svelte 5 (runes syntax: `$props()`, `$derived()`, `$state()`)
- **Language**: TypeScript (strict mode)
- **Styling**: Scoped Svelte `<style>` blocks + CSS custom properties (no Tailwind)
- **Icons**: Lucide Svelte + custom SVGs in `src/lib/components/icons/`
- **Build**: Vite 7 → Vercel adapter
- **Backend**: Supabase (auth + database)
- **PWA**: Standalone mobile-first app (max-width 480px)

---

## 1. Token Definitions

**Location**: `src/styles/tokens.css` (CSS custom properties on `:root`)

### Colors — Context-Driven Palette

Colors are semantic, mapped to **app moments** not generic names. Each context has 5 variants: base, hover, strong, muted (12% opacity), subtle (5% opacity).

| Context       | Token Prefix        | Hex        | Use Case                                  |
|---------------|---------------------|------------|-------------------------------------------|
| **Activity**  | `--color-activity`  | `#2dd4a8`  | Workouts, progress, active states (mint)  |
| **Rest**      | `--color-rest`      | `#64a1f4`  | Rest timers, rest days, recovery (blue)   |
| **Celebrate** | `--color-celebrate` | `#e8b931`  | PRs, milestones, streaks (gold)           |
| **Reflect**   | `--color-reflect`   | `#a78bfa`  | Check-ins, journaling (lavender)          |
| **Danger**    | `--color-danger`    | `#f27a7a`  | Skip, delete, errors (rose)              |

**Legacy alias**: `--color-accent` maps to `--color-activity` (defined in `src/app.css`).

**Brand gradient**: `--gradient-brand: linear-gradient(135deg, #2dd4a8, #e8b931, #a78bfa)`

### Surfaces (Warm Dark Theme)

All backgrounds have warm brown undertones — never use pure black/gray.

| Token                    | Value       | Purpose              |
|--------------------------|-------------|----------------------|
| `--color-bg`             | `#0b0a09`   | Base background      |
| `--color-bg-raised`      | `#12110f`   | Raised surfaces      |
| `--color-surface`        | `#17150f`   | Interactive surfaces |
| `--color-surface-hover`  | `#1d1b16`   | Hover state          |
| `--color-surface-active` | `#23211b`   | Active/pressed       |

### Borders

| Token                    | Value       |
|--------------------------|-------------|
| `--color-border`         | `#28251e`   |
| `--color-border-subtle`  | `#1f1d17`   |
| `--color-border-strong`  | `#34312a`   |

### Text

| Token                    | Value       | Purpose            |
|--------------------------|-------------|--------------------|
| `--color-text`           | `#f7f5f0`   | Primary text       |
| `--color-text-secondary` | `#a8a49b`   | Secondary/muted    |
| `--color-text-tertiary`  | `#736f66`   | Tertiary/disabled  |
| `--color-text-inverse`   | `#0b0a09`   | On light surfaces  |

### Typography

```css
--font-display: 'Manrope', sans-serif;  /* Headlines */
--font-body: 'Manrope', sans-serif;     /* Body text */
--font-mono: 'JetBrains Mono', monospace; /* Numbers, code */
```

**Type scale** (minor third 1.2x): `--text-2xs` (0.625rem) → `--text-4xl` (3rem)
**Weights**: `--weight-regular` (400), `--weight-medium` (500), `--weight-semibold` (600), `--weight-bold` (700), `--weight-extrabold` (800)
**Line heights**: `--leading-tight` (1.2), `--leading-snug` (1.35), `--leading-normal` (1.5), `--leading-relaxed` (1.65)
**Letter spacing**: `--tracking-tight` (-0.01em), `--tracking-normal` (0), `--tracking-wide` (0.05em), `--tracking-wider` (0.08em)

### Spacing

Base unit: `0.25rem`. Tokens: `--space-0` (0) through `--space-16` (4rem).

| Token           | Value   |
|-----------------|---------|
| `--page-gutter` | `1rem`  |
| `--page-max-width` | `480px` |

### Border Radius

`--radius-xs` (4px), `--radius-sm` (6px), `--radius-md` (8px), `--radius` (12px), `--radius-lg` (16px), `--radius-xl` (20px), `--radius-full` (9999px)

### Shadows

```css
--shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md:   0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg:   0 8px 24px rgba(0, 0, 0, 0.5);
--shadow-xl:   0 16px 48px rgba(0, 0, 0, 0.6);
--shadow-glow: 0 0 20px rgba(45, 212, 168, 0.15); /* mint glow */
```

### Motion

```css
--ease-out:     cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast:   100ms;
--duration-normal: 150ms;
--duration-slow:   300ms;
--duration-slower:  500ms;
```

### Z-Index Stack

`--z-base` (0) → `--z-raised` (10) → `--z-dropdown` (100) → `--z-sticky` (200) → `--z-overlay` (300) → `--z-modal` (400) → `--z-toast` (500)

### Safe Areas (PWA)

```css
--safe-top / --safe-bottom / --safe-left / --safe-right  /* env(safe-area-inset-*) */
--page-pad-top:    calc(var(--safe-top) + 1rem);
--page-pad-bottom: calc(var(--safe-bottom) + 2rem);
```

---

## 2. Component Library

**Location**: `src/lib/components/`

| Component         | Purpose                                | Key Props                              |
|-------------------|----------------------------------------|----------------------------------------|
| `Banner.svelte`   | Status/alert banner with dismiss       | `type`, `href`, `message`, `ondismiss` |
| `BottomNav.svelte`| Fixed 2-tab bottom navigation (hidden) | Active state via current path          |
| `icons/BarbellIcon.svelte` | Custom barbell SVG            | `size`, `color`, `class`              |

### Component Conventions

- **Svelte 5 runes** exclusively: `let { prop1, prop2 } = $props()`, `$derived()`, `$state()`
- **Self-contained styling**: Each component has a scoped `<style>` block
- **No external UI library**: All components are custom-built
- **Accessibility**: ARIA labels, semantic roles on interactive elements
- **BEM-like naming**: `.banner-body`, `.banner-icon`, `.banner-dismiss`

### Creating New Components

```svelte
<script lang="ts">
  import { SomeIcon } from 'lucide-svelte';

  let { label, variant = 'default' }: { label: string; variant?: string } = $props();
</script>

<div class="my-component" class:active={variant === 'active'}>
  <SomeIcon size={20} />
  <span>{label}</span>
</div>

<style>
  .my-component {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    transition: background var(--duration-normal) var(--ease-out);
  }

  .my-component:hover {
    background: var(--color-surface-hover);
  }

  .my-component.active {
    border-color: var(--color-activity);
  }
</style>
```

---

## 3. Icon System

**Primary**: [Lucide Svelte](https://lucide.dev) v1.0.1

```svelte
import { Dumbbell, TrendingUp, Check, X, ChevronRight } from 'lucide-svelte';
```

**Commonly used icons**:
`Dumbbell`, `TrendingUp`, `Check`, `X`, `ChevronLeft`, `ChevronRight`, `CalendarDays`, `Timer`, `Trophy`, `Flame`, `ClipboardCheck`, `Moon`, `CirclePlus`, `Pencil`, `LogOut`, `Target`, `Info`, `CircleUser`, `Play`, `Pause`, `RotateCcw`, `ChartNoAxesCombined`, `ArrowRight`

**Custom icons**: `src/lib/components/icons/` — used for brand-specific SVGs (e.g., `BarbellIcon`)

**Styling Lucide icons from parent**: Use `:global()` selector:
```svelte
.parent :global(svg) { color: var(--color-activity); }
```

---

## 4. Styling Approach

### No Tailwind — CSS Custom Properties + Scoped Styles

Every component uses a scoped `<style>` block. All values reference tokens from `tokens.css`.

**DO**: Use `var(--color-activity)`, `var(--space-4)`, `var(--radius)`
**DON'T**: Use hardcoded hex colors, pixel spacing, or Tailwind classes

### Global Styles

| File                  | Purpose                          |
|-----------------------|----------------------------------|
| `src/app.css`         | Imports tokens + reset, aliases  |
| `src/styles/tokens.css` | All design tokens             |
| `src/styles/reset.css`  | Browser reset + base body      |

### Page Layout Pattern

```css
.page-name {
  max-width: var(--page-max-width);  /* 480px */
  margin: 0 auto;
  padding: var(--page-pad-top) var(--page-gutter) var(--page-pad-bottom);
  min-height: 100dvh;
}
```

### Entrance Animations

Staggered entry via CSS custom property `--d`:

```svelte
<div class="card" class:push-up={shouldAnimate} style="--d:0">...</div>
<div class="card" class:push-up={shouldAnimate} style="--d:1">...</div>
```

```css
.push-up {
  animation: pushUp var(--duration-slow) var(--ease-out) calc(var(--d) * 60ms) both;
}

@keyframes pushUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Form Controls

Standard classes: `.form-input`, `.form-textarea`, `.form-label`, `.form-hint`, `.btn.btn-primary`

```css
.form-input {
  padding: 0.65rem 0.75rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--text-sm);
}
.form-input:focus {
  border-color: var(--color-accent);
  outline: none;
}
```

### Responsive

- **Mobile-first**: 480px max container, no breakpoints needed
- **Safe areas**: All padding accounts for notch/home indicator via `env(safe-area-inset-*)`
- **Touch targets**: `-webkit-tap-highlight-color: transparent` on interactive elements
- **Viewport**: `100dvh` for dynamic viewport height

---

## 5. Project Structure

```
src/
├── app.css                     # Root imports (tokens + reset)
├── app.html                    # HTML shell (fonts, PWA meta)
├── styles/
│   ├── tokens.css              # All design tokens
│   └── reset.css               # Browser reset
├── lib/
│   ├── components/             # Reusable UI components
│   │   ├── Banner.svelte
│   │   ├── BottomNav.svelte
│   │   └── icons/              # Custom SVG icon components
│   ├── server/                 # Server-only (Supabase, AI, ExerciseDB)
│   ├── types/                  # TypeScript types (database.ts, exercise.ts)
│   └── utils/                  # Client utilities (banner.ts, pr.ts)
└── routes/
    ├── +layout.svelte          # Root layout (auth)
    ├── (app)/                  # Protected routes (has BottomNav)
    │   ├── workout/            # Daily workout logging
    │   ├── plan/               # Weekly agenda
    │   ├── check-in/           # Weekly reflection
    │   ├── exercise/[id]/      # Exercise detail
    │   └── progress/           # Progress tracking
    ├── onboarding/             # 6-step setup wizard
    ├── auth/                   # OAuth callback/error
    └── api/                    # Server endpoints
```

### Route Conventions

- **`(app)/`** group: Authenticated routes with bottom nav shell
- **`[param]/`**: Dynamic segments (slugified IDs, not raw names)
- **`+page.server.ts`**: Data loading + form actions
- **`+page.svelte`**: Page component with scoped styles

---

## 6. Asset Management

- **Static**: `static/manifest.json`, `static/robots.txt`, PWA icons
- **Fonts**: Google Fonts loaded in `app.html` (Manrope 400-800, JetBrains Mono 700)
- **No image assets**: All visuals are SVG components or Lucide icons
- **PWA**: `manifest.json` — theme `#2dd4a8`, background `#0a0a0a`, standalone display

---

## 7. Figma-to-Code Translation Rules

When converting Figma designs to this codebase:

1. **Map Figma colors to context tokens** — Don't use hex values. Find the closest semantic context:
   - Green/mint → `--color-activity-*`
   - Blue → `--color-rest-*`
   - Gold/yellow → `--color-celebrate-*`
   - Purple/lavender → `--color-reflect-*`
   - Red/pink → `--color-danger-*`

2. **Map Figma spacing to `--space-*` tokens** — Round to nearest 0.25rem increment

3. **Map Figma radii to `--radius-*` tokens** — Use closest match

4. **Map Figma text styles** to token combinations:
   - Font family → `var(--font-display)` or `var(--font-body)`
   - Font size → `var(--text-*)` scale
   - Font weight → `var(--weight-*)`
   - Line height → `var(--leading-*)`

5. **Use scoped Svelte styles** — No utility classes, no Tailwind

6. **Use Lucide icons** — Search [lucide.dev](https://lucide.dev) for matching icon names

7. **Respect the warm dark theme** — All surfaces use warm-tinted dark colors, never pure gray/black

8. **Mobile-first** — Max 480px width, safe area padding, 56px bottom nav clearance
