// Seed integrity — cross-reference all slugs and basic invariants.
// Catches refactor errors (rename a concept slug but forget to update
// the sections/resources/challenges/connections that reference it).
//
// Runs against the in-memory seed data only — no DB connection needed.

import { describe, expect, test } from "bun:test";
import { phases, concepts } from "./content";
import { sections } from "./sections";
import { resources } from "./resources";
import { challenges } from "./challenges";
import { capstoneSteps } from "./capstone";
import { checkpoints, questions } from "./checkpoints";
import { connections } from "../../src/features/connections/data";

const phaseSlugs = new Set(phases.map((p) => p.slug));
const conceptSlugs = new Set(concepts.map((c) => c.slug));
const checkpointSlugs = new Set(checkpoints.map((c) => c.slug));

describe("seed integrity — cross-reference all slugs", () => {
  describe("phases", () => {
    test("phase slugs are unique", () => {
      const counts = new Map<string, number>();
      for (const p of phases) counts.set(p.slug, (counts.get(p.slug) ?? 0) + 1);
      const dups = [...counts.entries()].filter(([, n]) => n > 1);
      expect(dups).toEqual([]);
    });

    test("phase numbers are 1..N with no gaps", () => {
      const nums = phases.map((p) => p.number).sort((a, b) => a - b);
      expect(nums).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe("concepts", () => {
    test("concept slugs are unique", () => {
      const counts = new Map<string, number>();
      for (const c of concepts)
        counts.set(c.slug, (counts.get(c.slug) ?? 0) + 1);
      const dups = [...counts.entries()].filter(([, n]) => n > 1);
      expect(dups).toEqual([]);
    });

    test("every concept references a known phase", () => {
      const orphaned = concepts.filter((c) => !phaseSlugs.has(c.phase_slug));
      expect(orphaned).toEqual([]);
    });

    test("every concept has a positive estimated_minutes", () => {
      const bad = concepts.filter(
        (c) => !Number.isInteger(c.estimated_minutes) || c.estimated_minutes <= 0,
      );
      expect(bad.map((c) => c.slug)).toEqual([]);
    });

    test("no concept exceeds 60 estimated minutes (would suggest the unit is wrong)", () => {
      const tooLong = concepts.filter((c) => c.estimated_minutes > 60);
      expect(tooLong.map((c) => c.slug)).toEqual([]);
    });

    test("non-empty description and swe_analogy on every concept", () => {
      const missing = concepts.filter(
        (c) => !c.description.trim() || !c.swe_analogy.trim(),
      );
      expect(missing.map((c) => c.slug)).toEqual([]);
    });
  });

  describe("sections", () => {
    test("every section references a known concept", () => {
      const orphaned = sections.filter(
        (s) => !conceptSlugs.has(s.concept_slug),
      );
      expect(orphaned.map((s) => `${s.concept_slug}:${s.sort_order}`)).toEqual(
        [],
      );
    });

    test("section sort_orders are unique within each concept", () => {
      const seen = new Map<string, Set<number>>();
      const dups: string[] = [];
      for (const s of sections) {
        if (!seen.has(s.concept_slug)) seen.set(s.concept_slug, new Set());
        const set = seen.get(s.concept_slug)!;
        if (set.has(s.sort_order)) {
          dups.push(`${s.concept_slug}:${s.sort_order}`);
        }
        set.add(s.sort_order);
      }
      expect(dups).toEqual([]);
    });
  });

  describe("resources", () => {
    test("every resource references a known concept", () => {
      const orphaned = resources.filter(
        (r) => !conceptSlugs.has(r.concept_slug),
      );
      expect(orphaned.map((r) => `${r.concept_slug}:${r.title}`)).toEqual([]);
    });

    test("every resource has a non-empty title and URL", () => {
      const bad = resources.filter(
        (r) => !r.title.trim() || !r.url.trim() || !r.url.startsWith("http"),
      );
      expect(bad.map((r) => `${r.concept_slug}:${r.title}`)).toEqual([]);
    });
  });

  describe("challenges", () => {
    test("every challenge references a known concept", () => {
      const orphaned = challenges.filter(
        (c) => !conceptSlugs.has(c.concept_slug),
      );
      expect(orphaned.map((c) => c.concept_slug)).toEqual([]);
    });

    test("at most one challenge per concept (1:1 relation)", () => {
      const counts = new Map<string, number>();
      for (const c of challenges)
        counts.set(c.concept_slug, (counts.get(c.concept_slug) ?? 0) + 1);
      const dups = [...counts.entries()].filter(([, n]) => n > 1);
      expect(dups).toEqual([]);
    });

    test("every challenge has all required non-empty fields", () => {
      const incomplete = challenges.filter(
        (c) =>
          !c.prompt.trim() ||
          !c.fixture_sql.trim() ||
          !c.starter_sql.trim() ||
          !c.sample_solution.trim() ||
          !c.grading_notes.trim(),
      );
      expect(incomplete.map((c) => c.concept_slug)).toEqual([]);
    });

    test("every challenge has at least one expected row", () => {
      const empty = challenges.filter(
        (c) => !Array.isArray(c.expected_result) || c.expected_result.length === 0,
      );
      expect(empty.map((c) => c.concept_slug)).toEqual([]);
    });

    test("hints are an array (possibly empty) and contain only strings", () => {
      const malformed = challenges.filter(
        (c) =>
          !Array.isArray(c.hints) ||
          c.hints.some((h) => typeof h !== "string"),
      );
      expect(malformed.map((c) => c.concept_slug)).toEqual([]);
    });
  });

  describe("capstone steps", () => {
    test("step slugs are unique", () => {
      const counts = new Map<string, number>();
      for (const s of capstoneSteps)
        counts.set(s.slug, (counts.get(s.slug) ?? 0) + 1);
      const dups = [...counts.entries()].filter(([, n]) => n > 1);
      expect(dups).toEqual([]);
    });

    test("every step references a known phase (or null for the closer)", () => {
      const orphaned = capstoneSteps.filter(
        (s) => s.phase_slug !== null && !phaseSlugs.has(s.phase_slug),
      );
      expect(orphaned.map((s) => `${s.slug}:${s.phase_slug}`)).toEqual([]);
    });

    test("sort_order is contiguous starting at 1", () => {
      const orders = capstoneSteps.map((s) => s.sort_order).sort((a, b) => a - b);
      const expected = Array.from({ length: orders.length }, (_, i) => i + 1);
      expect(orders).toEqual(expected);
    });
  });

  describe("checkpoints and questions", () => {
    test("every checkpoint references a known phase", () => {
      const orphaned = checkpoints.filter((c) => !phaseSlugs.has(c.phase_slug));
      expect(orphaned.map((c) => c.slug)).toEqual([]);
    });

    test("checkpoint slugs are unique", () => {
      const counts = new Map<string, number>();
      for (const c of checkpoints)
        counts.set(c.slug, (counts.get(c.slug) ?? 0) + 1);
      const dups = [...counts.entries()].filter(([, n]) => n > 1);
      expect(dups).toEqual([]);
    });

    test("every question references a known checkpoint", () => {
      const orphaned = questions.filter(
        (q) => !checkpointSlugs.has(q.checkpoint_slug),
      );
      expect(orphaned.map((q) => q.checkpoint_slug)).toEqual([]);
    });

    test("every question has at least 2 options with exactly one correct", () => {
      const malformed = questions.filter((q) => {
        if (!Array.isArray(q.options) || q.options.length < 2) return true;
        const correct = q.options.filter((o) => o.correct).length;
        return correct !== 1;
      });
      expect(
        malformed.map((q) => `${q.checkpoint_slug}:${q.sort_order}`),
      ).toEqual([]);
    });
  });

  describe("concept connections", () => {
    test("every connection's `from` is a known concept", () => {
      const bad = connections.filter((c) => !conceptSlugs.has(c.from));
      expect(bad.map((c) => `${c.from} -> ${c.to}`)).toEqual([]);
    });

    test("every connection's `to` is a known concept", () => {
      const bad = connections.filter((c) => !conceptSlugs.has(c.to));
      expect(bad.map((c) => `${c.from} -> ${c.to}`)).toEqual([]);
    });

    test("no connection points a concept to itself", () => {
      const selfLoops = connections.filter((c) => c.from === c.to);
      expect(selfLoops.map((c) => c.from)).toEqual([]);
    });

    test("every connection has a non-empty label", () => {
      const empty = connections.filter((c) => !c.label.trim());
      expect(empty.map((c) => `${c.from} -> ${c.to}`)).toEqual([]);
    });

    test("strength is either 'strong' or 'normal'", () => {
      const bad = connections.filter(
        (c) => c.strength !== "strong" && c.strength !== "normal",
      );
      expect(bad.map((c) => `${c.from} -> ${c.to}`)).toEqual([]);
    });
  });

  describe("totals (sanity check on growth)", () => {
    test("≥ 7 phases", () => {
      expect(phases.length).toBeGreaterThanOrEqual(7);
    });
    test("≥ 43 concepts", () => {
      expect(concepts.length).toBeGreaterThanOrEqual(43);
    });
    test("≥ 21 challenges", () => {
      expect(challenges.length).toBeGreaterThanOrEqual(21);
    });
    test("every phase has at least one concept", () => {
      const empty = phases.filter(
        (p) => !concepts.some((c) => c.phase_slug === p.slug),
      );
      expect(empty.map((p) => p.slug)).toEqual([]);
    });
    test("every phase has a checkpoint", () => {
      const missing = phases.filter(
        (p) => !checkpoints.some((c) => c.phase_slug === p.slug),
      );
      expect(missing.map((p) => p.slug)).toEqual([]);
    });
  });
});
