# Data Engineering Learning Path

A concept-first data engineering curriculum for software engineers. Seven phases, each framed against a SWE practice the learner already knows. Per-concept progress tracking, debounced notes, per-phase quizzes, an end-to-end capstone project tracker, and a Claude-powered AI tutor scoped to the concept you're reading.

See `TECHNICAL_SPEC.md` for the full design.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript strict
- Tailwind CSS v4 (PostCSS plugin)
- Supabase (Postgres + Auth + RLS)
- `@supabase/ssr` for cookie-aware auth that works in server components
- `@anthropic-ai/sdk` for the AI tutor (`claude-sonnet-4-6` with prompt caching)
- Bun (install, scripts) — Next runs on Bun under dev
- Nix flake for a reproducible dev shell

## Prerequisites

Either:

- **Nix** (recommended). The flake provides `bun`, `supabase` CLI, and `nodejs_22`. Enter the shell with `nix develop` (or `direnv allow` if you use direnv).
- **Manual install**: Bun ≥ 1.3, Supabase CLI ≥ 2.100, Node 22.

Plus, on the host:

- Docker (used by `supabase start` for local Postgres/Auth, and for production builds).

## Local development

```bash
# 1. Enter the reproducible shell (skip if you installed deps manually)
nix develop

# 2. Install JS deps
bun install

# 3. Start local Supabase (Postgres + Auth + Studio + Mailpit, all in Docker)
supabase start
# → note the Publishable + Secret keys printed at the end

# 4. Copy the env template and fill in
cp .env.example .env.local
# Set:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<Publishable key from supabase start>
#   SUPABASE_SERVICE_ROLE_KEY=<Secret key from supabase start>
#   ANTHROPIC_API_KEY=<your Anthropic key>     ← only needed for the AI tutor
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 5. Apply schema + seed content
supabase db reset       # runs migrations 0001/0002/0003
bun run db:seed         # 7 phases, 14 concepts, 7 checkpoints (14 Qs), 3 capstone steps

# 6. Generate Supabase types (re-run anytime the schema changes)
bun run gen:types

# 7. Run the app
bun run dev
```

App on http://localhost:3000. Supabase Studio on http://127.0.0.1:54323. The magic-link inbox (Mailpit) is at http://127.0.0.1:54324 — open links from there, not from a Mac mail client (some clients pre-fetch links and consume the OTP).

## Scripts

| Script | What it does |
|---|---|
| `bun run dev` | Next.js dev server (Turbopack, hot reload) |
| `bun run build` | Production build with standalone output |
| `bun run start` | Run the production build |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | ESLint (flat config) |
| `bun run db:reset` | Re-apply all migrations against local Supabase |
| `bun run db:seed` | Run the idempotent content seed script |
| `bun run gen:types` | Regenerate `src/types/database.ts` from the live schema |

## Repository layout

```
src/
├── app/                # Next 16 App Router
│   ├── (app)/          # auth-gated route group: layout enforces session
│   │   ├── path/       # all 7 phases with progress bars
│   │   ├── phase/[slug]/
│   │   ├── concept/[slug]/
│   │   ├── checkpoint/[phaseSlug]/
│   │   ├── capstone/
│   │   └── dashboard/
│   ├── auth/
│   │   ├── page.tsx    # magic-link form
│   │   └── callback/route.ts
│   ├── api/tutor/route.ts  # streamed Claude responses
│   ├── page.tsx        # landing
│   └── layout.tsx
├── proxy.ts            # Next 16 proxy — refreshes session on every request
├── lib/supabase/       # browser/server/proxy clients (all use @supabase/ssr)
├── lib/anthropic.ts    # SDK singleton
├── features/           # path, phase, concept, progress, notes, checkpoint, capstone, tutor, dashboard
├── components/         # shared UI primitives
└── types/database.ts   # generated from Supabase schema

supabase/
├── config.toml
├── migrations/         # 0001 core, 0002 checkpoints, 0003 capstone + tutor
└── seed/               # content.ts, checkpoints.ts, capstone.ts, seed.ts
```

## Self-host with Docker

The app is a Next.js standalone build (~150MB image). Supabase runs as an external service — either Supabase Cloud or self-hosted Supabase via its own compose file.

```bash
# 1. Set the env vars docker-compose reads from your shell
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
export NEXT_PUBLIC_SITE_URL=https://learn.example.com
export ANTHROPIC_API_KEY=sk-ant-api03-...

# 2. Build and start
docker compose up --build -d
```

App on http://localhost:3000 (map the port however your reverse proxy expects).

**Build args vs runtime env:** `NEXT_PUBLIC_*` values are inlined into the client bundle at build time. The compose file passes them as both build args (for the client bundle) and runtime env (for server components). `ANTHROPIC_API_KEY` is server-only and only passed at runtime.

**Supabase Auth redirect URLs:** in your Supabase project's Auth settings, add `https://learn.example.com/auth/callback` (and any wildcard you want, e.g. `https://learn.example.com/**`) to the allow list. Without this the magic-link redirect will fail.

## Tests

There are no automated tests yet. The original spec called for them and they remain a TODO — pick Vitest or Playwright when the schema settles and feature surface stops moving.
