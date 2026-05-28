-- ── Enums ─────────────────────────────────────────────
create type progress_status as enum ('not_started', 'in_progress', 'completed');

-- ── Content: phases ───────────────────────────────────
create table phases (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  number      int  not null unique,
  title       text not null,
  tagline     text,
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
  resource_type text not null default 'article',
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

-- ── Row-Level Security ────────────────────────────────
alter table phases        enable row level security;
alter table concepts      enable row level security;
alter table resources     enable row level security;
alter table user_progress enable row level security;
alter table user_notes    enable row level security;

create policy "content readable" on phases
  for select to authenticated using (true);
create policy "content readable" on concepts
  for select to authenticated using (true);
create policy "content readable" on resources
  for select to authenticated using (true);

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
