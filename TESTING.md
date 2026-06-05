# Testing

The project uses **`bun test`** — Bun's built-in test runner. Jest-compatible API (`describe`, `test`, `expect`, `mock.module()`), TypeScript native, ~500ms full-suite runtime including jsdom-style globals.

```bash
bun test                    # run everything
bun test src/lib            # run a directory
bun test --watch            # re-run on file change
```

## What's covered today

**131 tests across 6 files.**

### Pure utilities

| File | What it tests |
|---|---|
| `src/lib/format.test.ts` | `formatMinutes()` — null/zero/negative → em-dash; `<60` → "~N min"; whole hours → "~Nh"; mixed → "~Nh Mm" (15 tests) |
| `src/features/challenge/compare.test.ts` | `compareResults()` — row count mismatch, missing column, extra column (allowed), exact value match, loose number↔string coercion, null/undefined handling, boolean, row ordering (21 tests) |

### Seed integrity

| File | What it tests |
|---|---|
| `supabase/seed/seed-integrity.test.ts` | Cross-references all slugs across content, sections, resources, challenges, capstone, checkpoints, and connections. Validates challenge fields are non-empty, expected_result is non-empty, every concept has a positive `estimated_minutes ≤ 60`, every phase has a checkpoint and at least one concept, every question has exactly one correct option (34 tests) |

The seed-integrity suite is the one most likely to catch a real bug. Refactoring a concept slug is easy to forget about and it catches every stale reference at CI time.

### Server actions

| File | What it tests |
|---|---|
| `src/features/explanation/actions.test.ts` | `submitExplanation` — input validation (min/max length, whitespace), auth check, concept lookup, Anthropic SDK errors (instantiation/network/no-tool-use/invalid-shape), score snap to 0.5, strengths/gaps truncation to 4, attempt counting, DB upsert errors, completion signal (24 tests) |
| `src/features/challenge/actions.test.ts` | `submitChallenge` — same shape as the explanation action plus: functional pass/fail × AI pass/fail combinations, the gap-injection behavior when the functional check fails, code trimming on save (22 tests) |

Both action tests mock `@/lib/supabase/server`, `@/lib/anthropic`, `@/features/progress/completion`, and `next/cache` via `mock.module()`. The Supabase chain mock supports `.from(table).select().eq().eq().maybeSingle()` plus `.order()` and `.upsert()`; tests configure per-table responses.

### React components

| File | What it tests |
|---|---|
| `src/features/explanation/ExplanationEvaluator.test.tsx` | Initial render with/without prior submission, threshold hint vs score badge, "Get feedback" vs "Reevaluate" vs "Already graded" button states, dirty-edit detection, feedback block visibility, submit flow with success and error responses, score and feedback rendering, passing-vs-failing tone (15 tests) |

The component-test harness uses **happy-dom** + **`@testing-library/react`** + **`@testing-library/user-event`**, registered globally via `bunfig.toml`'s `preload`. Adding a new component test is now ~30 min: write the file, the DOM globals are already there.

## Deferred test categories

### `CodeChallenge` component tests *(deferred)*

Would require mocking DuckDB-WASM — a real `Worker` boot and the `getDb()` singleton. The harness for that is its own ~half-day setup. The component logic worth testing (Submit-after-Run gating, result-panel rendering, hover labels) is currently rare to break compared to the server-side scoring logic.

**Trigger:** if the component's interactive state machine grows a third mode, or a regression slips through manual testing.

### Connection-graph layout tests *(deferred)*

The hierarchical-by-phase layout is deterministic and trivially testable. The force-directed layout uses `d3-force`'s seeded simulation, which is also deterministic, but the output is large and not particularly meaningful as an assertion target.

**Trigger:** if you change the layout algorithm and want a regression guard.

### End-to-end (Playwright) *(deferred)*

A full "sign in → open a concept → solve the challenge → see completion" run would be the most honest test of the system. Cost: Playwright setup, headless-browser running, Supabase test seeding, Anthropic key for the live grader (or recorded fixtures). ~1-2 days of focused work. The Anthropic side is the awkward part — a real call costs money; mocking it requires either VCR-style fixtures or a fake server.

**Trigger:** when a regression slips through manual testing AND would have been caught by a Playwright run.

### Migration tests *(deferred)*

Could write a test that boots a fresh Postgres in a container, applies all migrations, then asserts the expected tables and RLS policies exist. Cost: ~2-3 hours; nice but not currently load-bearing because `bun run db:reset` does effectively the same thing every time you reset the local DB.

**Trigger:** when migrations stop being trivial appends and start doing real data transformations.

### DuckDB-WASM smoke tests *(deferred)*

The browser-only DuckDB integration (`src/features/challenge/duckdb.ts`) can't be unit-tested without a fake `Worker` shim. The right test for it is the existing manual flow (open a challenge, click Run, verify results render). Best path forward is Playwright once that's set up.

## CI

There's no CI configured yet. When you set one up:

```yaml
- run: bun install --frozen-lockfile
- run: bun run typecheck
- run: bun test
```

The full suite is ~400-500ms (most of which is the React component test harness's happy-dom boot). `bun run typecheck` is the more expensive step (~2s); together they catch most of what manual review would catch.
