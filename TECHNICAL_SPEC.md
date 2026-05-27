# Technical Spec — Data Engineering Learning Path Web App

A handoff document for Claude Code to scaffold and begin building the application.
This document is self-contained: it includes the stack decisions, architecture,
data model, project structure, and a milestone-based build plan.

> **How to use this doc:** Work through the milestones in order (Section 12). Each
> milestone is independently runnable and verifiable. Don't skip ahead — later
> milestones assume earlier ones are in place. Decisions previously marked as open
> have been resolved by the project owner; see the Decisions log (Section 13) for
> what was chosen, when, and why.

---

## 1. Overview & goals

An interactive web app that teaches software engineers the concepts behind data
engineering, structured as a guided, progressive learning path. The content is a
7-phase concept-first curriculum (see Appendix A). Each concept is framed with an
analogy to a software engineering practice the learner already knows.

The app is more than a bookmark manager — it's intended to be a real learning tool:
read a concept, take notes, ask a Claude-powered tutor for clarification, validate
your understanding with a per-phase checkpoint quiz, and build an end-to-end
capstone project in parallel that exercises every phase.

### Primary goals

- Let a user browse the 7-phase learning path and drill into individual concepts.
- Track each user's progress (per concept, per phase, per checkpoint, and per
  capstone step) and persist it.
- Let users keep personal notes against each concept.
- Validate understanding with a short multiple-choice **checkpoint** at the end of
  each phase.
- Give users an **AI tutor** (Claude) that can answer questions in the context of
  the concept they're currently reading.
- Provide a **capstone project** tracker: an end-to-end pipeline arc the learner
  builds alongside the curriculum, broken into small steps tied to phases.
- Show a progress dashboard (overall %, per-phase completion, capstone status).

### Non-goals

- No content authoring UI — content is seeded into the database (Section 9).
- No social features, no payments, no mobile-native app.
- No multi-user collaboration on capstone projects.
- No content created by the LLM and persisted as curriculum — the tutor is a
  read-only helper; it does not author concepts.

### Success criteria for the first release

A logged-in user can: sign in via magic link, browse the full path, open a concept,
read its description and SWE analogy, mark it complete, write notes, chat with the
AI tutor about that concept, take a phase checkpoint quiz, track capstone progress,
and see overall progress on a dashboard — with all state persisted in Supabase and
protected by row-level security, and the whole app deployable via Docker.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict) | `strict: true` in tsconfig, no implicit `any`. |
| Runtime / package manager | Bun | Install, scripts, seed script, ad-hoc tooling. |
| Dev environment | Nix flake | Reproducible shell providing bun + supabase CLI (Section 5). |
| Framework | **Next.js 16+ (App Router)** | Server components, server actions, route handlers, native streaming. Turbopack is the default bundler. |
| Styling | Tailwind CSS v4 | PostCSS plugin (`@tailwindcss/postcss`); no `tailwind.config.ts` by default. |
| Data fetching (server) | React Server Components | Initial page loads read directly from Supabase server-side. |
| Data fetching (client) | TanStack Query | Mutations, optimistic updates, client refetches. |
| Backend / data | Supabase | Postgres + Auth (magic link) + Row-Level Security. |
| DB access | `@supabase/ssr` | Cookie-aware client; works in server components, client components, and route handlers. |
| AI integration | `@anthropic-ai/sdk` | Claude `claude-sonnet-4-6` for the tutor. Server-side only. Prompt caching enabled. |
| Hosting | Docker | Multi-stage Dockerfile + `docker-compose.yml`; Next.js `output: 'standalone'`. |

### Stack rationale

- **Why Next.js App Router?** The expanded scope wants server-side code (the AI
  tutor) and SSR-aware auth. App Router gives us route handlers, server actions,
  and server components without standing up a separate backend framework. This
  replaces the older spec's suggestion of Bun + Hono for server code — Next.js
  fills that role natively.
- **Why `@supabase/ssr`?** It's the modern Supabase helper for Next.js. It uses
  cookies (not localStorage) so server components and the proxy see the same
  session as the browser. The previously suggested `@supabase/supabase-js`-only
  setup doesn't work cleanly with server components.
- **Why keep Bun?** Package management is fast and reliable, the seed script is a
  natural Bun target, and Next.js runs fine under Bun for dev (`bun run dev`).
- **Why Docker for hosting?** The owner chose self-host. Standalone Next.js
  output containerizes cleanly into a small image. Supabase is consumed as an
  external service (either Supabase Cloud or self-hosted Supabase via its own
  docker-compose) — we do not bundle Supabase itself into our compose file.

### Next.js 16 specifics (things that changed from earlier versions)

Next.js 16 introduced several breaking changes that the rest of this spec
assumes. Future contributors who learned Next on v14/v15 must adjust:

- **`middleware.ts` is renamed to `proxy.ts`.** Same role (intercept requests
  before they hit pages) but **node-only runtime** — the `edge` runtime is no
  longer supported. The named export is `proxy`, not `middleware`. We use it
  for Supabase session refresh.
- **Async Request APIs.** `cookies()`, `headers()`, `draftMode()`, `params`,
  and `searchParams` are now Promises with no sync compatibility. Every
  `@supabase/ssr` server-side call site must `await cookies()` (and similar)
  before reading. Page components that consume `params`/`searchParams` must
  declare them as `Promise<{...}>` and `await` them.
- **Turbopack is the default** for `next dev` and `next build`. No
  `--turbopack` flag needed. A custom `webpack` config will fail the build
  unless you opt out with `--webpack`.
- **`next lint` is removed.** Run ESLint directly (`bun run lint` →
  `eslint`). `next build` no longer runs linting.
- **PPR / `dynamicIO` renamed.** The PPR opt-in is now the top-level
  `cacheComponents: true` option in `next.config.ts`. Not used in MVP; flagged
  for future perf work.
- **React 19.2.** App Router uses the React 19.2 canary line. `useEffectEvent`
  and View Transitions are available; React Compiler is available but not
  enabled by default.

---

## 3. High-level architecture

```
┌───────────────────────────────────────────────────┐
│ Browser                                            │
│  • Server-rendered HTML (RSC streamed payloads)    │
│  • Client components for interactivity             │
│  • TanStack Query (cache + optimistic UI)          │
└─────────────────────┬─────────────────────────────┘
                      │ HTTPS
                      ▼
┌───────────────────────────────────────────────────┐
│ Next.js server (Docker container)                  │
│                                                    │
│  • Server components → read content + user state   │
│  • Server actions → mutations (progress, notes)    │
│  • Route handlers:                                 │
│      POST /api/tutor       → Anthropic SDK         │
│      GET  /auth/callback   → exchange code for     │
│                              session cookies        │
│  • proxy.ts → refresh session on every req         │
│  • @supabase/ssr → cookie-aware Supabase client    │
│  • ANTHROPIC_API_KEY held server-side only         │
└─────────────────────┬─────────────────────────────┘
                      │ HTTPS (JWT)
                      ▼
┌───────────────────────────────────────────────────┐
│ Supabase                                           │
│  • Auth (magic link)                               │
│  • Postgres (content + user state)                 │
│  • Row-Level Security (per-user isolation)         │
└───────────────────────────────────────────────────┘
```

Key principles:

- The browser never holds a privileged key. It uses Supabase's anon key
  (publishable) and gets a session cookie after auth.
- The Anthropic API key is server-only. The tutor is exposed strictly through
  `/api/tutor`; there is no client-side path to the model.
- Access control is enforced server-side by RLS policies (Section 6). Content
  tables are world-readable to authenticated users; user state tables are
  readable/writable only by their owner.

---

## 4. Repository structure

```
de-learner/
├── flake.nix                    # Nix dev shell (Section 5)
├── flake.lock
├── .envrc                       # optional: `use flake` for direnv
├── package.json                 # Bun scripts & deps
├── bun.lockb
├── tsconfig.json
├── next.config.ts               # output: 'standalone'
├── postcss.config.mjs           # Tailwind v4 via @tailwindcss/postcss
├── Dockerfile                   # multi-stage (Section 11)
├── docker-compose.yml           # app service; external Supabase
├── .dockerignore
├── .env.local                   # gitignored — see .env.example
├── .env.example                 # committed template
│
├── supabase/
│   ├── config.toml              # supabase CLI config
│   ├── migrations/              # SQL migrations (schema in Section 6)
│   │   ├── 0001_init.sql
│   │   ├── 0002_checkpoints.sql
│   │   └── 0003_capstone_and_tutor.sql
│   └── seed/
│       ├── seed.ts              # entry point (Bun, Section 9)
│       ├── content.ts           # phases + concepts
│       ├── checkpoints.ts       # quiz questions per phase
│       └── capstone.ts          # capstone step definitions
│
├── src/
│   ├── proxy.ts                 # Next 16 proxy (renamed from middleware): refresh session
│   │
│   ├── app/                     # App Router
│   │   ├── layout.tsx           # root layout, fonts, providers
│   │   ├── providers.tsx        # TanStack QueryClient + AuthProvider
│   │   ├── globals.css          # tailwind entry
│   │   ├── page.tsx             # / landing
│   │   │
│   │   ├── auth/
│   │   │   ├── page.tsx              # /auth — magic-link email form
│   │   │   └── callback/route.ts     # /auth/callback — code → session
│   │   │
│   │   ├── (app)/               # route group: auth-gated via layout
│   │   │   ├── layout.tsx       # redirects to /auth if no session; nav shell
│   │   │   ├── path/page.tsx
│   │   │   ├── phase/[slug]/page.tsx
│   │   │   ├── concept/[slug]/page.tsx
│   │   │   ├── checkpoint/[phaseSlug]/page.tsx
│   │   │   ├── capstone/page.tsx
│   │   │   └── dashboard/page.tsx
│   │   │
│   │   └── api/
│   │       └── tutor/route.ts        # POST → Claude (Section 10)
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # browser singleton
│   │   │   ├── server.ts        # per-request server client (await cookies())
│   │   │   └── proxy.ts         # session refresh helper used by src/proxy.ts
│   │   ├── anthropic.ts         # Anthropic SDK singleton
│   │   └── queryClient.ts
│   │
│   ├── types/
│   │   └── database.ts          # generated Supabase types (Section 9)
│   │
│   ├── features/
│   │   ├── path/                # roadmap overview
│   │   ├── phase/               # phase detail
│   │   ├── concept/             # concept body, notes, tutor sidebar
│   │   ├── progress/            # progress hooks + server actions
│   │   ├── notes/               # debounced autosave
│   │   ├── checkpoint/          # quiz UI + scoring
│   │   ├── capstone/            # step tracker
│   │   └── tutor/               # tutor chat panel + client
│   │
│   ├── components/              # shared UI (Button, Card, ProgressBar, ...)
│   └── styles/                  # tailwind extras
│
└── README.md
```

Notable structural choices:

- **Route group `(app)`** — its layout enforces auth (redirects to `/auth` when no
  session) and renders the navigation shell. Everything inside the group inherits
  this gate without leaking into the URL.
- **`features/` over `routes/`** — page files in `app/` stay thin; the real logic
  (queries, mutations, UI composition) lives under `features/` and is imported by
  page files. Keeps pages re-routable.
- **Two Supabase clients** — `client.ts` for the browser, `server.ts` for server
  components/actions/route handlers. They are NOT interchangeable; using the wrong
  one breaks cookie handling.

---

## 5. Development environment (Nix + Bun)

A `flake.nix` provides a reproducible shell. Everyone gets the same Bun, Node
(some tooling expects a `node` binary), and Supabase CLI versions.

```nix
{
  description = "Data Engineering Learning Path — dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.bun
            pkgs.supabase-cli
            pkgs.nodejs_22
            pkgs.git
          ];

          shellHook = ''
            echo "DE Learning Path dev shell"
            echo "  bun       $(bun --version)"
            echo "  node      $(node --version)"
            echo "  supabase  $(supabase --version 2>/dev/null || echo 'n/a')"
          '';
        };
      });
}
```

> **Docker** is a host-level dependency (used for `supabase start` and for
> packaging the production image). It is not provided by the flake — install it
> via Docker Desktop, Colima, or your distro's package manager.

Optional `.envrc` for direnv users:

```
use flake
```

### First-run commands

```bash
# enter the reproducible shell
nix develop          # or `direnv allow` if using direnv

# install JS deps
bun install

# start local Supabase (Postgres, Auth, etc. in Docker)
supabase start

# apply migrations + seed content
supabase db reset           # runs migrations
bun run db:seed             # seeds curriculum, checkpoints, capstone

# generate types from the live schema
bun run gen:types

# run the app
bun run dev
```

### `package.json` scripts (sketch)

```jsonc
{
  "name": "de-learner",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "db:reset": "supabase db reset",
    "db:seed": "bun run supabase/seed/seed.ts",
    "gen:types": "supabase gen types typescript --local > src/types/database.ts"
  }
}
```

### Environment variables (`.env.example`)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-only; used by seed.ts; NEVER expose

# Anthropic
ANTHROPIC_API_KEY=                  # server-only; used by /api/tutor

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # used for magic-link redirect
```

---

## 6. Supabase data model

Postgres schema. Content tables hold the curriculum, checkpoint quizzes, and
capstone steps. User tables hold per-user state. All tables have RLS enabled.
`auth.users` is Supabase's built-in table.

### 6.1 Core schema — migration `0001_init.sql`

```sql
-- ── Enums ─────────────────────────────────────────────
create type progress_status as enum ('not_started', 'in_progress', 'completed');

-- ── Content: phases ───────────────────────────────────
create table phases (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  number      int  not null unique,        -- 1..7
  title       text not null,
  tagline     text,                         -- the italic subtitle
  sort_order  int  not null,
  created_at  timestamptz not null default now()
);

-- ── Content: concepts ─────────────────────────────────
create table concepts (
  id           uuid primary key default gen_random_uuid(),
  phase_id     uuid not null references phases(id) on delete cascade,
  slug         text not null unique,
  title        text not null,
  description  text not null,
  swe_analogy  text not null,
  sort_order   int  not null,
  created_at   timestamptz not null default now()
);
create index on concepts (phase_id);

-- ── Content: resources ────────────────────────────────
create table resources (
  id            uuid primary key default gen_random_uuid(),
  concept_id    uuid references concepts(id) on delete cascade,
  phase_id      uuid references phases(id)   on delete cascade,
  title         text not null,
  url           text not null,
  resource_type text not null default 'article',  -- article | video | docs | course
  created_at    timestamptz not null default now(),
  check (concept_id is not null or phase_id is not null)
);

-- ── User state: progress ──────────────────────────────
create table user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  concept_id   uuid not null references concepts(id)   on delete cascade,
  status       progress_status not null default 'not_started',
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (user_id, concept_id)
);
create index on user_progress (user_id);

-- ── User state: notes ─────────────────────────────────
create table user_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  concept_id  uuid not null references concepts(id)   on delete cascade,
  body        text not null default '',
  updated_at  timestamptz not null default now(),
  unique (user_id, concept_id)
);
create index on user_notes (user_id);
```

### 6.2 Checkpoints — migration `0002_checkpoints.sql`

```sql
-- ── Content: checkpoint definitions ───────────────────
create table checkpoints (
  id           uuid primary key default gen_random_uuid(),
  phase_id     uuid not null references phases(id) on delete cascade,
  slug         text not null unique,
  title        text not null,
  description  text,
  pass_score   int  not null default 70,          -- minimum percent to pass
  sort_order   int  not null,
  created_at   timestamptz not null default now()
);
create index on checkpoints (phase_id);

-- ── Content: checkpoint questions ─────────────────────
create table checkpoint_questions (
  id             uuid primary key default gen_random_uuid(),
  checkpoint_id  uuid not null references checkpoints(id) on delete cascade,
  prompt         text not null,
  -- options stored as JSON array: [{ "id": "a", "text": "...", "correct": true }, ...]
  options        jsonb not null,
  explanation    text,                            -- shown after answering
  sort_order     int  not null,
  created_at     timestamptz not null default now()
);
create index on checkpoint_questions (checkpoint_id);

-- ── User state: quiz attempts ─────────────────────────
create table quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  checkpoint_id  uuid not null references checkpoints(id) on delete cascade,
  -- answers: { "<question_id>": "<option_id>", ... }
  answers        jsonb not null,
  score          int  not null,                   -- percent
  passed         boolean not null,
  attempted_at   timestamptz not null default now()
);
create index on quiz_attempts (user_id, checkpoint_id);
```

### 6.3 Capstone + tutor — migration `0003_capstone_and_tutor.sql`

```sql
-- ── Content: capstone step definitions ────────────────
create table capstone_steps (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  phase_id     uuid references phases(id) on delete set null,  -- which phase this exercises
  title        text not null,
  description  text not null,                     -- what to build / do
  hints        text,
  sort_order   int  not null,
  created_at   timestamptz not null default now()
);

-- ── User state: capstone progress ─────────────────────
create table user_capstone_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  step_id      uuid not null references capstone_steps(id) on delete cascade,
  status       progress_status not null default 'not_started',
  notes        text not null default '',
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (user_id, step_id)
);
create index on user_capstone_progress (user_id);

-- ── User state: tutor conversation log ────────────────
create table tutor_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  concept_id  uuid references concepts(id) on delete set null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);
create index on tutor_messages (user_id, concept_id, created_at);
```

### 6.4 Row-Level Security

```sql
-- Enable RLS everywhere
alter table phases                  enable row level security;
alter table concepts                enable row level security;
alter table resources               enable row level security;
alter table user_progress           enable row level security;
alter table user_notes              enable row level security;
alter table checkpoints             enable row level security;
alter table checkpoint_questions    enable row level security;
alter table quiz_attempts           enable row level security;
alter table capstone_steps          enable row level security;
alter table user_capstone_progress  enable row level security;
alter table tutor_messages          enable row level security;

-- Content tables: readable by any authenticated user
create policy "content readable" on phases               for select to authenticated using (true);
create policy "content readable" on concepts             for select to authenticated using (true);
create policy "content readable" on resources            for select to authenticated using (true);
create policy "content readable" on checkpoints          for select to authenticated using (true);
create policy "content readable" on checkpoint_questions for select to authenticated using (true);
create policy "content readable" on capstone_steps       for select to authenticated using (true);

-- Per-user state: owner-only full access
-- (one trio of policies — select / insert / update — per user-state table)
create policy "own select" on user_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on user_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on user_progress
  for update to authenticated using (auth.uid() = user_id);

create policy "own select" on user_notes
  for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on user_notes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on user_notes
  for update to authenticated using (auth.uid() = user_id);

create policy "own select" on quiz_attempts
  for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on quiz_attempts
  for insert to authenticated with check (auth.uid() = user_id);

create policy "own select" on user_capstone_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on user_capstone_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on user_capstone_progress
  for update to authenticated using (auth.uid() = user_id);

create policy "own select" on tutor_messages
  for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on tutor_messages
  for insert to authenticated with check (auth.uid() = user_id);
```

> Quiz attempts are append-only by design — once recorded, they can't be edited.
> No update policy on `quiz_attempts`.

> Content tables (`phases`, `concepts`, `resources`, `checkpoints`,
> `checkpoint_questions`, `capstone_steps`) are seeded by an admin process using
> the service-role key (which bypasses RLS), not by end users — so no
> insert/update policies are defined for them. Intentional.

### 6.5 Derived data

Per-phase and overall progress, capstone completion %, and "next thing to do" are
**computed server-side** in server components from the underlying tables. If query
patterns become hot, introduce a Postgres view or RPC; don't pre-optimize.

---

## 7. Routes / pages

| Route | Type | Auth | Purpose |
|---|---|---|---|
| `/` | page | public | Landing; CTA to sign in. |
| `/auth` | page | public | Magic-link email form. |
| `/auth/callback` | route handler | n/a | Exchange code for session cookies, redirect. |
| `/path` | page | required | All 7 phases with completion bars. |
| `/phase/[slug]` | page | required | A phase's concepts, plus a checkpoint card. |
| `/concept/[slug]` | page | required | Description, SWE analogy, resources, mark-complete, notes, AI tutor panel. |
| `/checkpoint/[phaseSlug]` | page | required | Phase quiz; records attempts; shows result + explanations. |
| `/capstone` | page | required | Capstone step list with status, per-step notes. |
| `/dashboard` | page | required | Overall %, per-phase progress, capstone progress, "continue where you left off". |
| `/api/tutor` | route handler | required | POST: send tutor message; returns Claude response. |

Authenticated routes live inside the `(app)` route group; the group's layout
redirects to `/auth` when there's no session.

---

## 8. Core features (functional requirements)

1. **Auth** — magic-link via Supabase Auth. `/auth/callback` route handler
   exchanges the code for a session and sets cookies. The Next 16 proxy
   (`src/proxy.ts`) refreshes the session on every request so server components
   see a valid user.
2. **Browse the path** — `/path` server-renders all phases (with per-phase
   completion %) in one query joining `phases ← concepts ← user_progress`.
3. **Concept detail** — `/concept/[slug]` server-renders description, SWE
   analogy, and resources. Client islands handle: mark-complete button, notes
   textarea, AI tutor panel.
4. **Progress tracking** — concepts can be `not_started`, `in_progress`, or
   `completed`. Marking complete is a **server action** that upserts
   `user_progress` and revalidates the affected pages. TanStack Query handles
   optimistic UI on the client.
5. **Notes** — textarea per concept, upserted into `user_notes` via a debounced
   (~500ms) server action.
6. **Phase checkpoints** — `/checkpoint/[phaseSlug]` renders ~5–8 multiple-choice
   questions. Submitting scores client-side first (for instant feedback), then
   posts the attempt to a server action that writes to `quiz_attempts`. Pass/fail
   is recorded; failing lets the user retry. A passed checkpoint marks the phase
   "validated" in dashboard/path views.
7. **Capstone tracker** — `/capstone` lists steps in order, each tied to a phase.
   Each step has its own status and notes. Server action upserts
   `user_capstone_progress`.
8. **AI tutor** — see Section 10.
9. **Dashboard** — server-renders overall %, per-phase concept progress, per-phase
   checkpoint status, capstone %, and a "continue" link to the next incomplete
   concept (or capstone step).

---

## 9. Content seeding & types

### Seeding

Curriculum content (Appendix A), checkpoint questions, and capstone steps are
loaded by `supabase/seed/seed.ts`, run with Bun. It uses the **service-role key**
(server-side only, never shipped to the client) so it can write to content tables
despite RLS. The script must be idempotent — upsert by `slug` so re-running
doesn't duplicate rows.

Shapes to seed:
- 7 `phases`, each with its `concepts` (title, description, swe_analogy).
- 7 `checkpoints` (one per phase), each with ~5–8 `checkpoint_questions`.
- ~10–15 `capstone_steps` representing the end-to-end pipeline arc, each tied to
  a phase.

### Generated types

After migrations are applied, run `bun run gen:types` to generate
`src/types/database.ts` from the live schema. Import these types in the Supabase
clients and query hooks so the data layer is fully typed.

---

## 10. AI tutor

The tutor is exposed at `POST /api/tutor`. The route handler:

1. Authenticates the request via the Supabase session cookie (rejects if no user).
2. Reads the request body: `{ conceptSlug, messages: [{role, content}, ...] }`.
3. Loads the concept row from Postgres (title, description, swe_analogy) and its
   phase context.
4. Constructs a Claude message with **prompt caching** enabled:
   - **Cached system prompt** (long, reused): a teaching-style instruction
     ("You are a tutor helping a software engineer learn data engineering...
     Frame answers in terms of SWE analogies they likely know.") concatenated
     with the concept's content and phase context. This block is marked
     `cache_control: { type: "ephemeral" }`.
   - **User messages** (short, variable): the conversation turns.
5. Calls Claude `claude-sonnet-4-6` with streaming enabled.
6. Streams the response back to the client (text/event-stream).
7. After the stream completes, persists both the user's last message and the
   assistant reply to `tutor_messages` for history.

Client side: a chat panel on `/concept/[slug]` that loads prior `tutor_messages`
for that user+concept, accepts a new question, streams the response in, and
appends to local state.

Cost note: prompt caching is essential — the system prompt is large (full concept
context) and reused across every turn within the 5-minute TTL. Without caching,
each turn would re-bill the entire context.

Out of scope for v1: function calling, retrieval beyond the active concept,
multi-concept conversations. The tutor stays scoped to the concept the user is
reading.

---

## 11. Docker packaging

### `next.config.ts`

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
};

export default config;
```

### `Dockerfile` (multi-stage)

```dockerfile
# ── deps stage ────────────────────────────────────────
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# ── builder stage ─────────────────────────────────────
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ── runner stage ──────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
```

> Why bun for build, node for runtime? `bun run build` is fast and stable for
> Next.js. The standalone output is a Node.js server (`server.js`), so the
> runtime image uses `node:22-alpine` — smaller and well-supported by Next.js.

### `docker-compose.yml`

```yaml
services:
  app:
    build: .
    image: de-learner:latest
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
    restart: unless-stopped
```

Supabase is consumed as an external service: either Supabase Cloud or a
self-hosted Supabase (its own docker-compose, run separately). We do not bundle
Supabase into this compose file — it would dwarf the app and conflate concerns.

---

## 12. Build milestones (work in this order)

Each milestone ends in a runnable, verifiable state.

1. **Environment & scaffold.** `flake.nix` + dev shell; `bun create next-app`
   (App Router, TS, Tailwind, ESLint); `bun run dev` serves the default page.
   *Verify:* page loads at localhost:3000, typecheck passes.
2. **Supabase local + core schema.** `supabase init`/`start`; migration
   `0001_init.sql` (Section 6.1); `supabase db reset` applies it.
   *Verify:* `phases`, `concepts`, `resources`, `user_progress`, `user_notes`
   exist in local Studio with RLS enabled.
3. **Extended schema.** Migrations `0002_checkpoints.sql` and
   `0003_capstone_and_tutor.sql`.
   *Verify:* checkpoint, capstone, and tutor tables exist with RLS.
4. **Seed + types.** Write `seed.ts`, `content.ts`, `checkpoints.ts`,
   `capstone.ts`; seed content; run `gen:types`.
   *Verify:* all content tables populated; `src/types/database.ts` generated and
   imported by Supabase clients.
5. **Supabase clients + auth.** `lib/supabase/{client,server,proxy}.ts`;
   `src/proxy.ts` (Next 16 proxy file); `/auth` page; `/auth/callback` route
   handler; `(app)` route group with auth-gating layout.
   *Verify:* magic link arrives, clicking returns to the app with a session;
   protected pages redirect when signed out.
6. **Content browsing.** `/path`, `/phase/[slug]`, `/concept/[slug]` rendering
   from Supabase via server components.
   *Verify:* all 7 phases and their concepts render with descriptions, analogies,
   and resources.
7. **Progress tracking.** Mark-complete / in-progress server actions upsert
   `user_progress`; TanStack Query handles optimistic UI; status reflected in
   phase and path views.
   *Verify:* status persists across reload; a second user can't see the first's
   progress (RLS check).
8. **Notes.** Debounced autosave textarea per concept; server action upserts
   `user_notes`.
   *Verify:* notes persist and are owner-scoped.
9. **Checkpoints / quizzes.** `/checkpoint/[phaseSlug]` renders questions,
   scores client-side, posts attempt via server action; pass/fail surfaces on
   the phase and path views.
   *Verify:* attempts recorded; passing a checkpoint updates the phase's
   "validated" state; failing allows retry.
10. **Capstone tracker.** `/capstone` lists steps with status and notes; server
    action upserts `user_capstone_progress`.
    *Verify:* steps persist; capstone % shows on dashboard.
11. **AI tutor.** `/api/tutor` route handler with prompt caching; client chat
    panel on concept pages; tutor history persists in `tutor_messages`.
    *Verify:* streaming reply appears; subsequent turns within 5 min hit the
    prompt cache (check `cache_read_input_tokens` in logs).
12. **Dashboard.** Overall %, per-phase progress, per-phase checkpoint status,
    capstone %, "continue" link.
    *Verify:* numbers match actual progress; updates as concepts complete and
    checkpoints pass.
13. **Docker packaging + polish.** Dockerfile, docker-compose, `output:
    'standalone'` in `next.config.ts`, README with full setup + deploy steps;
    loading/empty/error states; responsive layout; accessibility pass (semantic
    HTML, focus management, alt text).
    *Verify:* `docker compose up --build` boots a working app pointed at a
    Supabase URL; README walks a new dev from clone to running.

---

## 13. Decisions log

Resolved by the project owner on **2026-05-27**:

| # | Decision | Choice | Notes |
|---|---|---|---|
| 1 | Frontend framework | **Next.js 16+ (App Router)** | Replaces the older Vite SPA default. Enables native server-side code for the AI tutor without a separate backend. See "Next.js 16 specifics" in Section 2 for breaking changes (`middleware` → `proxy`, async Request APIs). |
| 2 | Auth method | **Magic link** | Passwordless. Owner: "fine for now." |
| 3 | Scope | **Full** — MVP + ideation additions + all stretch items | Includes phase checkpoints, capstone tracker, and AI tutor. Owner: "include anything and everything necessary for this app to be useful." |
| 4 | Hosting | **Self-host via Docker** | Dockerfile + docker-compose. Supabase consumed as external service. |
| 5 | AI tutor model | **`claude-sonnet-4-6`** | Default — good cost/quality balance for educational chat. Prompt caching mandatory. |
| 6 | Content management | **Seed-from-code** | No admin UI in scope. |

Future decisions to revisit:

- Whether to add an admin UI for content editing (only if a non-engineer needs
  to edit curriculum content).
- Whether to expand the tutor's scope (multi-concept, function calling,
  retrieval) — defer until usage data motivates it.
- Whether to expose case studies of real data platforms as a sidebar (ideation
  doc's "Reading real systems" suggestion).

---

## Appendix A — Curriculum content to seed

Seven phases, each with concepts framed against a SWE analogy. The full prose
lives in `de_learning_path.md`. Two additions relative to that file are flagged
**[NEW]** — these come from the ideation doc's top conceptual recommendations.

**Phase 1 — Thinking in data, not requests** *(the core mindset shift)*
- Data is the product, not a side effect
- Batch vs. real-time — like sync vs. async execution models
- Understanding data consumers — analysts and ML models, not APIs and UIs
- Schemas as contracts — like interface definitions, but for data over time

**Phase 2 — Data modeling fundamentals** *(structured for reads at scale)*
- Normalization vs. denormalization — the DRY vs. query-speed tension
- Dimensional modeling — facts and context, like events and their metadata
- Slowly changing dimensions — versioning records, like git history
- OLTP vs. OLAP — row-optimized vs. column-optimized stores
- Data vault & medallion patterns — layered architecture, like clean/domain separation

**Phase 3 — Data movement and transformation** *(ETL/ELT & reliable pipelines)*
- ETL vs. ELT — where the compute lives
- Idempotency — safe to re-run, like idempotent API endpoints
- Incremental vs. full loads — like diffing vs. full rebuilds
- Data quality & testing — unit/integration tests for data; assertion frameworks; schema validation at ingestion
- Transformation logic — separating raw from curated layers

**Phase 4 — Pipeline orchestration and reliability** *(scheduling & failure handling)*
- DAGs — like a build dependency tree, for data jobs
- Dependency management — topological ordering of tasks
- Backfilling — re-processing history, like replaying an event log
- Failure modes — retries, dead-letter queues, alerting
- SLAs for data — freshness/completeness guarantees, like uptime contracts

**Phase 5 — Streaming and event-driven data** *(data in motion)*
- Event streams — a persistent, replayable, ordered queue
- Stream processing — transform on arrival, not after
- Windowing — aggregate over time windows, like rolling averages
- **[NEW]** Time and ordering — event time vs. processing time, late-arriving data, watermarks
- Exactly-once vs. at-least-once — like distributed transaction tradeoffs
- State management in streams — context across events, like session tracking

**Phase 6 — Storage, scale, and compute** *(physical storage & querying at scale)*
- Columnar vs. row storage — optimized for scans, not point lookups
- Partitioning and clustering — like sharding, but for query pruning
- Distributed compute — data locality matters like cache locality
- Data lake vs. warehouse — raw flexible vs. structured queryable
- Cost vs. performance — scans cost money; modeling is optimization

**Phase 7 — Data platform thinking** *(infrastructure as a product)*
- Data contracts — producer/consumer agreements, like API versioning
- Observability — lineage, freshness, anomalies, like distributed tracing
- Governance — access control, PII, audit trails, like RBAC/compliance
- Self-serve data — systems others can query safely
- Breaking changes — schema evolution as a versioning problem

---

## Appendix B — Capstone project arc (to seed as `capstone_steps`)

The capstone is one end-to-end pipeline a learner builds alongside the
curriculum. Each step exercises a phase. The exact tooling is the learner's
choice (the description is platform-agnostic); hints suggest popular options.

1. **Pick a data source and define the contract** *(Phase 1)* — choose a public
   dataset or API, write down the schema you're consuming, including data types,
   nullability, and update cadence.
2. **Model a target schema** *(Phase 2)* — design the analytical tables you'd
   want to query. Decide what's a fact, what's a dimension, and what slow
   changes look like.
3. **Build the ingestion step** *(Phase 3)* — write an idempotent load from
   source to a raw layer. Make re-running cheap and safe.
4. **Add transformations** *(Phase 3)* — go from raw to curated. Add at least
   two data quality checks that fail loudly.
5. **Orchestrate it** *(Phase 4)* — wire the steps into a DAG with a scheduler.
   Add at least one retry policy and one alert.
6. **Backfill historical data** *(Phase 4)* — run the pipeline against a
   historical window. Verify idempotency by running it twice.
7. **Stream a slice in real time** *(Phase 5)* — pick one part of the pipeline
   to make event-driven. Handle a late-arriving event correctly.
8. **Choose physical storage** *(Phase 6)* — partition the curated table by a
   sensible key. Measure how much data a typical query scans before and after.
9. **Publish a contract and a dashboard** *(Phase 7)* — write a one-page data
   contract for one curated table (owner, freshness SLA, schema, change
   policy). Build a small dashboard that consumes it.
10. **Evolve the schema** *(Phase 7)* — make a backward-compatible schema
    change and a backward-incompatible one. Document the migration for each.

Each step's `description` should be a paragraph or two with the specific
deliverable; `hints` should suggest 2–3 popular tools (e.g., for orchestration:
"Dagster, Airflow, or Prefect").
