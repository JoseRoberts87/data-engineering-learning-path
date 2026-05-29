-- ── Enum: concept section type ────────────────────────
create type concept_section_type as enum (
  'failure_catalog',
  'comparison',
  'dimensions',
  'inline_quiz'
);

-- ── Content: concept sections ─────────────────────────
-- Each row is a structured section attached to a concept; the shape of
-- `payload` depends on `type` (validated in the seed + UI, not in SQL).
create table concept_sections (
  id          uuid primary key default gen_random_uuid(),
  concept_id  uuid not null references concepts(id) on delete cascade,
  type        concept_section_type not null,
  sort_order  int  not null,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);
create index on concept_sections (concept_id, sort_order);

-- ── Row-Level Security ────────────────────────────────
alter table concept_sections enable row level security;

create policy "content readable" on concept_sections
  for select to authenticated using (true);
