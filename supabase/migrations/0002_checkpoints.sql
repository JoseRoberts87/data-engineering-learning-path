-- ── Content: checkpoint definitions ───────────────────
create table checkpoints (
  id           uuid primary key default gen_random_uuid(),
  phase_id     uuid not null references phases(id) on delete cascade,
  slug         text not null unique,
  title        text not null,
  description  text,
  pass_score   int  not null default 70,
  sort_order   int  not null,
  created_at   timestamptz not null default now()
);
create index on checkpoints (phase_id);

-- ── Content: checkpoint questions ─────────────────────
create table checkpoint_questions (
  id             uuid primary key default gen_random_uuid(),
  checkpoint_id  uuid not null references checkpoints(id) on delete cascade,
  prompt         text not null,
  options        jsonb not null,
  explanation    text,
  sort_order     int  not null,
  created_at     timestamptz not null default now()
);
create index on checkpoint_questions (checkpoint_id);

-- ── User state: quiz attempts (append-only) ───────────
create table quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  checkpoint_id  uuid not null references checkpoints(id) on delete cascade,
  answers        jsonb not null,
  score          int  not null,
  passed         boolean not null,
  attempted_at   timestamptz not null default now()
);
create index on quiz_attempts (user_id, checkpoint_id);

-- ── Row-Level Security ────────────────────────────────
alter table checkpoints          enable row level security;
alter table checkpoint_questions enable row level security;
alter table quiz_attempts        enable row level security;

create policy "content readable" on checkpoints
  for select to authenticated using (true);
create policy "content readable" on checkpoint_questions
  for select to authenticated using (true);

create policy "own select" on quiz_attempts
  for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on quiz_attempts
  for insert to authenticated with check (auth.uid() = user_id);
