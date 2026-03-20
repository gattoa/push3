# Push

**AI-powered personal training — personalized weekly plans that adapt to your progress.**

Push is a mobile-first PWA that gives you the experience of having a personal trainer in your pocket. Each week, an AI coach generates a personalized workout plan based on your goals, equipment, injuries, and actual performance history. You train, log your lifts, and the plan gets smarter over time. Built with SvelteKit, Supabase, and the Anthropic Claude API.

---

## Tech Stack

| Layer           | Technology                                    |
|-----------------|-----------------------------------------------|
| Framework       | SvelteKit 2 + Svelte 5 (runes)               |
| Language        | TypeScript (strict)                           |
| Auth / DB       | Supabase (Auth, Postgres, Storage)            |
| Exercise Data   | Self-hosted ExerciseDB v1 (AGPL-3.0)         |
| AI Generation   | Anthropic Claude API (Batch + synchronous)    |
| Styling         | Custom CSS with design tokens                 |
| Build           | Vite 7                                        |
| Distribution    | PWA via @vite-pwa/sveltekit                   |
| Hosting         | Vercel                                        |

## Getting Started

```sh
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key

# Start dev server
npm run dev
```

## Scripts

| Command              | Description                     |
|----------------------|---------------------------------|
| `npm run dev`        | Start development server        |
| `npm run build`      | Create production build         |
| `npm run preview`    | Preview production build        |
| `npm run check`      | Run svelte-check type checking  |
| `npm run check:watch`| Type check in watch mode        |

## Environment Variables

```
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Product Brief](./docs/product/product-brief.md) | Vision, problem statement, personas, feature spec |
| [Architecture Plan](./docs/technical/architecture-plan-generation.md) | Weekly generation cycle, data flow, architectural decisions |
| [Tech Stack](./docs/technical/tech-stack.md) | Stack choices, hosting, cost model, data flow |
| [Research Findings](./docs/research/Research-Findings-Report.md) | Competitive analysis, exercise science review, technical feasibility |

---

## Current Status

Phase 0 (Foundation & Auth) is complete: SvelteKit scaffold, Supabase auth with Google OAuth, animated login page, service worker, PWA manifest, and global design tokens.

---

## Architecture

```
src/
├── routes/              # SvelteKit file-based routing
│   ├── auth/            # OAuth callback handling
│   ├── +layout.*        # Root layout (auth, session)
│   └── +page.svelte     # Login / landing page
├── lib/                 # Shared utilities
├── hooks.server.ts      # Server middleware (auth)
├── service-worker.ts    # PWA offline caching
├── app.css              # Global styles & design tokens
├── app.d.ts             # TypeScript declarations
└── app.html             # HTML shell
```

## Design System

| Token                | Value       | Usage              |
|----------------------|-------------|--------------------|
| `--color-bg`         | `#0a0a0a`   | Page background    |
| `--color-surface`    | `#141414`   | Cards, panels      |
| `--color-border`     | `#262626`   | Borders, dividers  |
| `--color-text`       | `#fafafa`   | Primary text       |
| `--color-text-muted` | `#a1a1aa`   | Secondary text     |
| `--color-accent`     | `#22c55e`   | CTAs, highlights   |
| Font (display)       | JetBrains Mono | Headings, brand |
| Font (body)          | Inter          | Body text        |

## License

Private — All rights reserved.
