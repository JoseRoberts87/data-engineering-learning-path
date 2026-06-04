-- ═══════════════════════════════════════════════════════════════════
-- Code challenges — an optional second completion gate per concept.
--
-- code_challenges (content): one row per concept that has a challenge,
--   seeded via the standard pipeline. Contains the prompt, fixture
--   SQL, the user-visible starter, an expected result the server
--   compares against, plus a sample solution + grading notes that the
--   AI grader sees but the user does not.
--
-- user_challenge_submissions (user state): one row per (user, challenge).
--   Updated in place on retry; attempt_count is incremented. RLS limits
--   reads/writes to the owner.
-- ═══════════════════════════════════════════════════════════════════

create table code_challenges (
  id                uuid primary key default gen_random_uuid(),
  concept_id        uuid not null unique references concepts(id) on delete cascade,
  prompt            text not null,
  starter_sql       text not null,
  fixture_sql       text not null,
  expected_result   jsonb not null,
  sample_solution   text not null,
  grading_notes     text,
  hints             jsonb,
  created_at        timestamptz not null default now()
);

create index on code_challenges (concept_id);

alter table code_challenges enable row level security;

create policy "content readable" on code_challenges
  for select to authenticated using (true);

-- ─────────────────────────────────────────────────────

create table user_challenge_submissions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  challenge_id    uuid not null references code_challenges(id) on delete cascade,
  concept_id      uuid not null references concepts(id) on delete cascade,
  code            text not null,
  passed_tests    boolean not null,
  ai_score        numeric(2,1) not null check (ai_score >= 0 and ai_score <= 5),
  ai_feedback     jsonb not null,
  attempt_count   int  not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, challenge_id)
);

create index on user_challenge_submissions (user_id, challenge_id);
create index on user_challenge_submissions (user_id, concept_id);

alter table user_challenge_submissions enable row level security;

create policy "owner can read" on user_challenge_submissions
  for select to authenticated
  using (auth.uid() = user_id);

create policy "owner can insert" on user_challenge_submissions
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "owner can update" on user_challenge_submissions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "owner can delete" on user_challenge_submissions
  for delete to authenticated
  using (auth.uid() = user_id);
