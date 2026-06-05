-- Per-concept time estimate, in minutes. Static curriculum value
-- (not measured from user behavior). Sums up to a phase total for
-- the path landing page and phase pages.

alter table concepts
  add column estimated_minutes int not null default 15;
