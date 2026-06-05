# Testing

The project uses **`bun test`** — Bun's built-in test runner. Jest-compatible API (`describe`, `test`, `expect`), zero config, ~100ms full-suite runtime. No new dependencies; if you already have the dev shell you have the test runner.

```bash
bun test                    # run everything
bun test src/lib            # run a directory
bun test --watch            # re-run on file change
```

## What's covered today

| File | What it tests |
|---|---|
| `src/lib/format.test.ts` | `formatMinutes()` — null/zero/negative → em-dash; `<60` → "~N min"; whole hours → "~Nh"; mixed → "~Nh Mm" |
| `src/features/challenge/compare.test.ts` | `compareResults()` — row count mismatch, missing column, extra column (allowed), exact value match, loose number↔string coercion, null/undefined handling, boolean, row ordering |
| `supabase/seed/seed-integrity.test.ts` | Cross-references all slugs across content, sections, resources, challenges, capstone, checkpoints, and connections. Validates challenge fields are non-empty, expected_result is non-empty, every concept has a positive `estimated_minutes ≤ 60`, every phase has a checkpoint and at least one concept, every question has exactly one correct option |

The seed-integrity test is the most valuable one operationally: refactoring a concept slug is easy to forget about — this catches every stale reference at CI time.

## Deferred test categories

The following aren't tested yet. They're listed in roughly priority order; pick them up when the failure mode becomes worth the setup cost.

### React component tests *(deferred)*

The interactive UI (CodeChallenge, ExplanationEvaluator, ConnectionsGraph, the section renderers) would benefit from component-level tests — *"given this challenge and submission, the score badge renders green and the gate-passed copy shows."* Cost: requires `jsdom` + `@testing-library/react` + mocks for `next/navigation`, `next/link`, and `@xyflow/react`'s ResizeObserver dependency. ~3-4 hours to set up the harness, then ~30 min per component.

When to do it: when component logic gets non-trivial enough that visual review stops being sufficient — e.g., if the score badge's color logic gets a new state, or if completion gating gets a third gate.

### Server action tests *(deferred)*

`submitExplanation` and `submitChallenge` are the highest-stakes server-side code (they're what graders call, and they wire completion). Worth testing end-to-end with mocked Supabase + Anthropic clients to validate: (a) bad inputs are rejected, (b) the structured-output schema is enforced, (c) `recomputeConceptCompletion` is called with the right args, (d) the upserts shape correctly. Cost: ~4-5 hours to build a Supabase client mock that respects RLS-shape responses + an Anthropic client mock that returns tool-use blocks. Fragile relative to the libraries.

Workaround in the meantime: the *grading logic* (comparing rows, validating tool-use input shape) is covered by `compare.test.ts`. The *DB upserts* are exercised by manual smoke tests every time the dev shell is reseeded.

### End-to-end (Playwright) *(deferred)*

A full "sign in → open a concept → solve the challenge → see completion" run would be the most honest test of the system end-to-end. Cost: Playwright setup, headless-browser running, Supabase test seeding, Anthropic key for the live grader (or recorded fixtures). ~1-2 days of focused work. The Anthropic side is the awkward part — a real call costs money, but mocking it requires either VCR-style fixtures or a fake server.

When to do it: when there's a regression that slipped through manual testing AND would have been caught by a Playwright run.

### Migration tests *(deferred)*

Could write a test that boots a fresh Postgres in a container, applies all migrations, then asserts the expected tables and RLS policies exist. Cost: ~2-3 hours; nice but not currently load-bearing because `bun run db:reset` does effectively the same thing every time you reset the local DB.

### Connection-graph layout tests *(deferred)*

The hierarchical-by-phase layout is deterministic and trivially testable. The force-directed layout uses `d3-force`'s seeded simulation, which is also deterministic, but the output is large and not particularly meaningful as an assertion target. Skip unless you change the layout algorithm and want a regression guard.

### DuckDB-WASM smoke tests *(deferred)*

The browser-only DuckDB integration (`src/features/challenge/duckdb.ts`) can't be unit-tested without jsdom + a fake `Worker` shim. The right test for it is the existing manual flow (open a challenge, click Run, verify results render). Realistically, the right level of coverage is one Playwright run per challenge — see the E2E entry.

## CI

There's no CI configured yet. When you set one up, the test command should be a single line:

```yaml
- run: bun install --frozen-lockfile
- run: bun run typecheck
- run: bun test
```

The full suite is ~100ms so it can run on every push without any meaningful cost. `bun run typecheck` is the more expensive step (~2s); together they catch most of what manual review would catch.
