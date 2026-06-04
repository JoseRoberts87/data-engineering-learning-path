-- ═══════════════════════════════════════════════════════════════════
-- Concept explanations — the AI-graded "explain in your own words"
-- gate that determines concept completion.
--
-- One row per (user, concept). On retry, the row is updated in place
-- and attempt_count is incremented. Completion of concept_progress is
-- driven by the server action when score >= 3.5.
-- ═══════════════════════════════════════════════════════════════════

create table concept_explanations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  concept_id      uuid not null references concepts(id) on delete cascade,
  explanation     text not null,
  -- numeric(2,1) gives one decimal place (0.0 to 5.0)
  score           numeric(2,1) not null check (score >= 0 and score <= 5),
  feedback        jsonb not null,
  attempt_count   int  not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, concept_id)
);

create index on concept_explanations (user_id, concept_id);

-- ── Row-Level Security ────────────────────────────────
alter table concept_explanations enable row level security;

create policy "owner can read" on concept_explanations
  for select to authenticated
  using (auth.uid() = user_id);

create policy "owner can insert" on concept_explanations
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "owner can update" on concept_explanations
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner can delete" on concept_explanations
  for delete to authenticated
  using (auth.uid() = user_id);
