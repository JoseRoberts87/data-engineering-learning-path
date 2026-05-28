-- ── Content: capstone step definitions ────────────────
create table capstone_steps (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  phase_id     uuid references phases(id) on delete set null,
  title        text not null,
  description  text not null,
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

-- ── Row-Level Security ────────────────────────────────
alter table capstone_steps          enable row level security;
alter table user_capstone_progress  enable row level security;
alter table tutor_messages          enable row level security;

create policy "content readable" on capstone_steps
  for select to authenticated using (true);

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
