# Push — Tech Stack & Hosting

## Stack Overview

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | SvelteKit (Svelte 5) | App shell, routing, SSR, API routes |
| Distribution | PWA (via @vite-pwa/sveltekit) | Offline support, home screen install, push notifications |
| Database & Auth | Supabase (Postgres + Auth + Storage) | User data, plans, logs, check-ins, photos, Google OAuth |
| Exercise data | Self-hosted ExerciseDB v1 (AGPL-3.0) | Exercise catalog with GIFs, instructions, muscle data |
| AI plan generation | Anthropic Claude API (Batch + synchronous) | Weekly coaching intelligence |
| Hosting | Vercel | SvelteKit app + ExerciseDB instance |

---

## Frontend: SvelteKit + Svelte 5

**Choice:** SvelteKit with Svelte 5 runes reactivity ($state, $derived).

**Why:** Svelte compiles to minimal JavaScript with no virtual DOM overhead — ideal for a mobile-first PWA where bundle size and runtime performance matter. SvelteKit provides file-based routing, server-side rendering, and API routes in a single framework, eliminating the need for a separate backend. The Svelte 5 runes model is already in use throughout the workout store.

**Key packages:**
- `@sveltejs/kit` — framework
- `@sveltejs/adapter-vercel` — Vercel deployment adapter
- `@sveltejs/vite-plugin-svelte` — build tooling
- `lucide-svelte` — icon library (Dumbbell, Trophy, TrendingUp, ChevronRight, ClipboardCheck, Eye, X, Menu, etc.)
- `vite` — bundler

## Distribution: PWA

**Choice:** Progressive Web App via `@vite-pwa/sveltekit`.

**Why:** Athletes use this app in gyms where connectivity may be unreliable. A PWA provides offline capability for workout logging, home screen installation for native-like access, and push notification support for "your plan is ready" alerts after batch generation. No app store fees, no review process, instant updates.

**Manifest config:**
- Display: standalone (full-screen, no browser chrome)
- Theme: #000000
- Icons: 192px and 512px PNG

**Offline strategy:** The current week's plan is cached locally after initial fetch. Set logs are written to localStorage immediately and synced to Supabase opportunistically. The PWA service worker caches static assets and the app shell.

## Database & Auth: Supabase

**Choice:** Supabase (hosted Postgres + Auth + Storage) on the free tier.

**Why:** Supabase provides the full backend stack — relational database, authentication, file storage, and row-level security — under a single service with a generous free tier. This avoids managing separate services for auth, database, and photo storage.

**Free tier limits:**
- 500 MB database
- 1 GB file storage (progress photos)
- 50,000 monthly active users
- Unlimited API requests

**Auth:** Google OAuth via Supabase Auth. Single sign-on, no password management. Apple Sign-In may be added later for iOS home screen users.

**Data model responsibilities:**
- `weekly_plans` — plan metadata per user per week
- `planned_days` — 7 days per plan with split labels
- `planned_exercises` — exercises assigned to each day
- `planned_sets` — prescribed sets with target reps/weight
- `set_logs` — actual performance logged by the athlete
- `check_ins` — weekly check-in data (weight, injuries, photos)
- `user_settings` — preferences, equipment, goals

**Optimization:** Current waterfall queries (5 sequential reads for plan fetch) should be consolidated into a single Postgres function (RPC) to minimize round trips.

## Exercise Data: Self-Hosted ExerciseDB v1

**Choice:** Self-hosted ExerciseDB v1 (open source, AGPL-3.0), deployed as a separate Vercel project.

**Why:** The previous architecture used ExerciseDB via RapidAPI, which imposed a 100 calls/day rate limit and prohibited caching — creating a hard scaling ceiling of ~25 users. The underlying ExerciseDB is open source and can be self-hosted, eliminating both constraints.

**Technical details:**
- Runtime: Bun + Hono (lightweight serverless framework)
- Database: None — exercise data is bundled in the project
- Data: ~5,000 exercises with GIFs, images, target muscles, equipment, step-by-step instructions
- Deployment: One-click Vercel deploy, pre-configured via `vercel.json`
- Caching: Vercel edge cache (`s-maxage=300, stale-while-revalidate`) handles repeated queries automatically
- License: AGPL-3.0 — compliance satisfied by linking to source repo if unmodified

**Source:** [ExerciseDB v1 Open Source Repo](https://github.com/bootstrapping-lab/exercisedb-api)

## AI Plan Generation: Anthropic Claude API

**Choice:** Claude Sonnet via the Batch API (default) with synchronous fallback.

**Why:** Claude's value is in coaching intelligence — interpreting performance trends, recognizing plateaus, adjusting programming based on adherence and body composition data. The Batch API provides a 50% cost reduction for asynchronous processing, which fits the weekly generation cadence. Synchronous fallback is used only when the athlete's next training day is within 24 hours of check-in.

**Pricing (Claude Sonnet):**
- Standard: $3/M input tokens, $15/M output tokens
- Batch API: $1.50/M input tokens, $7.50/M output tokens (50% discount)

**Estimated per-user cost:**
- ~7,750 input tokens + ~3,500 output tokens per generation
- Batch API: ~$0.04/user/week
- Synchronous fallback: ~$0.08/user/week

**Key package:** `@anthropic-ai/sdk`

---

## Hosting: Vercel (Free Tier)

**Choice:** Vercel free tier for both the SvelteKit app and the self-hosted ExerciseDB instance, deployed as two separate projects.

**Why:** Vercel provides 60-second serverless function timeouts (sufficient for synchronous Claude fallback), first-class SvelteKit support via adapter-vercel, automatic edge caching, and GitHub-connected deploys. The ExerciseDB v1 repo is pre-configured for Vercel deployment. Running both on the same platform simplifies operations.

**Free tier limits:**
- 100 GB bandwidth/month
- Serverless functions: 60-second timeout
- Automatic HTTPS
- GitHub integration for CI/CD

---

## Cost Summary

| Service | Cost |
|---|---|
| Vercel (SvelteKit app) | Free |
| Vercel (ExerciseDB instance) | Free |
| Supabase (database, auth, storage) | Free tier |
| Anthropic Claude Batch API | ~$0.04/user/week |
| **RapidAPI ExerciseDB** | **Cancelled** (replaced by self-hosted) |

**Total fixed infrastructure cost: $0/month.**
**Variable cost: ~$0.04 per user per week** (Anthropic API only).

| Users | Monthly Anthropic Cost |
|---|---|
| 100 | ~$16 |
| 1,000 | ~$160 |
| 10,000 | ~$1,600 |

---

## Data Flow: Source of Truth

**Supabase is the source of truth.** localStorage serves only as an offline cache for the current week's plan and in-progress set logs. This is a change from the previous architecture where localStorage was primary and Supabase was async backup.

**Why the inversion matters:** The new architecture depends on complete historical data in Supabase for plan generation. If data lives primarily in localStorage, it's lost when the athlete clears their browser, switches devices, or reinstalls the PWA. Supabase-first ensures data durability and cross-device access.

**Sync strategy:**
- Plan fetch: Supabase → localStorage (cache for offline use)
- Set log writes: localStorage (immediate) → Supabase (debounced sync, 300ms)
- Check-in data: Direct to Supabase (online-only operation)
- Conflict resolution: Supabase wins (server timestamp comparison)
