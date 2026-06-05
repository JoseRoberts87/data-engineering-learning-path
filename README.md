# Data Engineering Learning Path

A concept-first data engineering curriculum for software engineers — 7 phases, 43 concepts, each framed against a SWE practice the learner already knows. Per concept you get a curated description with markdown + a SWE analogy, four interactive sections (failure catalog, comparison table, dimensions, inline quiz), a curated set of cross-phase connection references, and curated external resources. Completion runs through two AI-graded gates: an own-words explanation evaluator (all 43 concepts) and a DuckDB-WASM code challenge (21 of them). End-to-end the curriculum estimates at ~14 hours, with a parallel 8-step capstone tracker that maps each phase to a real-world deliverable.

See `TECHNICAL_SPEC.md` for the full design and `de_concept_connections.md` for the synthesis-level map of how concepts relate across phases.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript strict
- Tailwind CSS v4 (PostCSS plugin)
- Supabase (Postgres + Auth + RLS)
- `@supabase/ssr` for cookie-aware auth that works in server components
- `@anthropic-ai/sdk` — `claude-sonnet-4-6` with prompt caching; streaming for the tutor, structured tool-use output for the explanation + code graders
- `@duckdb/duckdb-wasm` — the code-challenge runtime executes SQL in the browser
- `@uiw/react-codemirror` + `@codemirror/lang-sql` — the SQL editor in the code-challenge UI
- `@xyflow/react` + `d3-force` — the `/connections` graph (hierarchical and force-directed layouts)
- `react-markdown` + `remark-gfm` — markdown rendering for concept descriptions and capstone steps
- `next-themes` — light/dark/system theme toggle
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
#   ANTHROPIC_API_KEY=<your Anthropic key>     ← needed for tutor + explanation + code grader
#   NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 5. Apply schema + seed content
supabase db reset       # runs migrations 0001 through 0007
bun run db:seed
# → 7 phases · 43 concepts · 172 sections · 88 resources
#   7 checkpoints · 70 quiz questions
#   21 code challenges · 8 capstone steps

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
| `bun run db:seed` | Idempotent content seed (phases, concepts, sections, resources, checkpoints, challenges, capstone) |
| `bun run gen:types` | Regenerate `src/types/database.ts` from the live schema |

## Migrations

Numbered in order; each runs once per environment.

| File | What it adds |
|---|---|
| `0001_init.sql` | Phases, concepts, resources, user_progress, user_notes |
| `0002_checkpoints.sql` | Per-phase quizzes (checkpoints + questions + attempts) |
| `0003_capstone_and_tutor.sql` | Capstone steps + user step progress; tutor message history |
| `0004_concept_sections.sql` | Interactive section type enum + content table |
| `0005_concept_explanations.sql` | AI-graded own-words explanation gate (user state with RLS) |
| `0006_code_challenges.sql` | Code challenges (content) + user submissions (state with RLS) |
| `0007_concept_estimates.sql` | `estimated_minutes` per concept |

## Repository layout

```
src/
├── app/                # Next 16 App Router
│   ├── (app)/          # auth-gated route group: layout enforces session
│   │   ├── path/                 # all 7 phases with progress + time totals
│   │   ├── phase/[slug]/         # concept list for one phase
│   │   ├── concept/[slug]/       # full concept: description, sections, connections,
│   │   │                         # code challenge, explanation evaluator, notes, tutor
│   │   ├── checkpoint/[phaseSlug]/  # per-phase quiz
│   │   ├── capstone/             # 8-step capstone with markdown + concept links
│   │   ├── connections/          # interactive concept graph
│   │   └── dashboard/
│   ├── auth/
│   │   ├── page.tsx              # magic-link form
│   │   └── callback/route.ts     # PKCE exchange + diagnostic error surfacing
│   ├── api/tutor/route.ts        # streamed Claude responses
│   ├── page.tsx                  # landing
│   └── layout.tsx
├── proxy.ts            # Next 16 proxy — refreshes session on every request
├── lib/
│   ├── supabase/       # browser/server/proxy clients (all use @supabase/ssr)
│   ├── anthropic.ts    # SDK singleton
│   └── format.ts       # shared formatters (e.g., formatMinutes)
├── features/
│   ├── path/           # phase list + cards (with time totals)
│   ├── phase/          # concept list within a phase
│   ├── concept/        # concept fetch + 4 interactive section renderers
│   ├── progress/       # completion logic; recomputeConceptCompletion is the single source of truth for the AND-of-gates
│   ├── notes/          # debounced per-concept notes
│   ├── checkpoint/     # quiz logic + attempts
│   ├── capstone/       # 8 steps + per-step progress + per-step notes
│   ├── tutor/          # streaming chat UI bound to one concept
│   ├── dashboard/      # progress aggregation
│   ├── connections/    # static connection data + concept-page "Connects to" + /connections graph
│   ├── explanation/    # explanation evaluator (server action + Claude grader)
│   └── challenge/      # code-challenge UI (CodeMirror + DuckDB-WASM) + server action + grader
├── components/         # shared UI primitives (ThemeToggle, etc.)
└── types/database.ts   # generated from Supabase schema

supabase/
├── config.toml
├── migrations/         # 0001-0007 (see migrations table above)
└── seed/
    ├── content.ts       # phases + concepts (with estimated_minutes)
    ├── checkpoints.ts   # per-phase quiz questions
    ├── resources.ts     # concept-scoped external links
    ├── sections.ts      # interactive sections
    ├── challenges.ts    # code-challenge content (21 challenges)
    ├── capstone.ts      # 8 capstone steps
    └── seed.ts          # idempotent runner
```

## Completion model

A concept is **complete** when *all* applicable gates pass:

1. **Explanation gate** (all 43 concepts) — write your own-words explanation; Claude returns a 0–5 score via structured output and feedback (summary, strengths, gaps, next step). Threshold: **≥ 3.5**.
2. **Code challenge gate** (21 concepts that have one) — write SQL in the browser; DuckDB-WASM executes it; the server compares the rows against a hidden expected result and Claude grades the *approach* on top. Threshold: **functional pass AND AI score ≥ 3.5**.

Completion is sticky in the up direction only — once a concept passes both gates, a later worse attempt does not un-complete it. All completion writes go through `features/progress/completion.ts:recomputeConceptCompletion()`, called by both gate server actions.

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

## Cloud deployment (Supabase + Vercel)

The app deploys to Vercel cleanly. The Supabase side has two gotchas worth knowing.

**Supabase Auth → URL Configuration:**
- `Site URL` = your production origin (e.g., `https://your-app.vercel.app`)
- `Redirect URLs` includes `https://your-app.vercel.app/**`

**Email confirmation should be off** for the magic-link flow. With "Confirm email" enabled, new users get a separate confirmation email whose PKCE token (a) can't survive cross-browser clicks and (b) gets pre-fetched by Gmail's anti-phishing scanner. Disabling it lets the magic link itself be the email confirmation. Supabase dashboard → Authentication → Sign In / Providers → Email → uncheck **Confirm email**.

**Applying migrations to an already-bootstrapped cloud project.** If you've previously initialized the schema by other means, `supabase db push --linked` will fail at the first migration with `type "progress_status" already exists`. Repair the migration history once, then push:

```bash
supabase migration repair --status applied 0001 0002 0003 0004 --linked
supabase db push --linked
```

(Adjust the version list to whichever migrations are already applied.) Then seed the cloud DB by running the seed script against the cloud credentials:

```bash
SUPABASE_SERVICE_ROLE_KEY=<cloud-service-role-key> \
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  bun run db:seed
```

## Tests

There are no automated tests yet. The original spec called for them and they remain a TODO — pick Vitest or Playwright once the feature surface stops moving.
