import {
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

// Same mocking pattern as features/explanation/actions.test.ts — see
// that file for the rationale on the chain-mock structure.

type TableResponses = {
  maybeSingle?: { data: unknown; error?: unknown };
  order?: { data: unknown; error?: unknown };
  upsert?: { error?: unknown };
};

function makeSupabaseMock(opts: {
  user?: { id: string } | null;
  tables?: Record<string, TableResponses>;
}) {
  const tables = opts.tables ?? {};
  const user = "user" in opts ? opts.user : { id: "u-1" };
  return {
    auth: {
      getUser: async () => ({ data: { user } }),
    },
    from: (table: string) => {
      const r = tables[table] ?? {};
      const chain: Record<string, unknown> = {};
      for (const m of ["select", "eq", "in", "neq"])
        chain[m] = () => chain;
      chain.maybeSingle = async () =>
        r.maybeSingle ?? { data: null, error: null };
      chain.order = async () => r.order ?? { data: [], error: null };
      chain.upsert = async () => r.upsert ?? { error: null };
      return chain;
    },
  };
}

function makeAnthropicMock(opts: {
  toolUseInput?: unknown;
  contentOverride?: Array<{ type: string; input?: unknown }>;
  throwInstantiation?: boolean;
  throwOnCreate?: boolean;
}) {
  const content =
    opts.contentOverride ??
    (opts.toolUseInput
      ? [{ type: "tool_use", input: opts.toolUseInput }]
      : []);
  return {
    messages: {
      create: async () => {
        if (opts.throwOnCreate) throw new Error("anthropic network error");
        return { content };
      },
    },
    throwInstantiation: opts.throwInstantiation ?? false,
  };
}

let supabaseMock: ReturnType<typeof makeSupabaseMock>;
let anthropicMock: ReturnType<typeof makeAnthropicMock>;
let recomputeReturn: { completed: boolean };

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => supabaseMock,
}));

mock.module("@/lib/anthropic", () => ({
  getAnthropicClient: () => {
    if (anthropicMock.throwInstantiation) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    return anthropicMock;
  },
  TUTOR_MODEL: "claude-sonnet-4-6-test",
}));

mock.module("@/features/progress/completion", () => ({
  recomputeConceptCompletion: async () => recomputeReturn,
}));

mock.module("next/cache", () => ({
  revalidatePath: () => {},
}));

const { submitChallenge } = await import("./actions");

const validToolUseInput = {
  score: 4.0,
  summary: "Clean MERGE with EXCLUDED — idempotent by construction.",
  strengths: ["Uses ON CONFLICT correctly"],
  gaps: [],
  next_step: "Try the same pattern against a partition-overwrite shape.",
};

const sampleCode = `INSERT INTO orders (order_id, amount, status)
SELECT order_id, amount, status FROM staging_orders
ON CONFLICT (order_id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status;`;

// The default expected rows + matching actual rows → functional pass.
const expectedRows = [
  { order_id: 100, amount: 49.99, status: "shipped" },
  { order_id: 101, amount: 25.5, status: "pending" },
];
const matchingActual = [...expectedRows];

function defaultChallengeResponse(opts?: { expected?: Array<Record<string, unknown>> }) {
  return {
    maybeSingle: {
      data: {
        id: "ch-1",
        concept_id: "c-1",
        prompt: "Write an idempotent UPSERT.",
        fixture_sql: "CREATE TABLE orders ...",
        expected_result: opts?.expected ?? expectedRows,
        sample_solution: "INSERT ... ON CONFLICT ...",
        grading_notes: "Reward ON CONFLICT pattern.",
      },
    },
  };
}

function defaultConceptResponse() {
  return {
    maybeSingle: {
      data: {
        id: "c-1",
        title: "Idempotency",
        phases: { number: 3, title: "Movement" },
      },
    },
  };
}

beforeEach(() => {
  supabaseMock = makeSupabaseMock({
    user: { id: "u-1" },
    tables: {
      code_challenges: defaultChallengeResponse(),
      concepts: defaultConceptResponse(),
      user_challenge_submissions: {
        maybeSingle: { data: null },
        upsert: { error: null },
      },
    },
  });
  anthropicMock = makeAnthropicMock({ toolUseInput: validToolUseInput });
  recomputeReturn = { completed: true };
});

describe("submitChallenge", () => {
  describe("input validation", () => {
    test("rejects empty code", async () => {
      const result = await submitChallenge("ch-1", "", matchingActual);
      expect(result).toEqual({
        ok: false,
        error: "Empty code — write a query first.",
      });
    });

    test("rejects whitespace-only code", async () => {
      const result = await submitChallenge("ch-1", "   \n  ", matchingActual);
      expect(result.ok).toBe(false);
    });

    test("rejects oversized code", async () => {
      const result = await submitChallenge(
        "ch-1",
        "x".repeat(4001),
        matchingActual,
      );
      expect(result).toEqual({
        ok: false,
        error: "Code is too long (max 4000 chars).",
      });
    });

    test("rejects when actualResult is not an array", async () => {
      const result = await submitChallenge(
        "ch-1",
        sampleCode,
        // deliberately wrong shape — runtime callers can't strict-type this
        null as unknown as Array<Record<string, unknown>>,
      );
      expect(result).toEqual({
        ok: false,
        error: "Missing run result. Run the query first.",
      });
    });
  });

  describe("auth and existence checks", () => {
    test("rejects when no user is signed in", async () => {
      supabaseMock = makeSupabaseMock({
        user: null,
        tables: {
          code_challenges: defaultChallengeResponse(),
          concepts: defaultConceptResponse(),
        },
      });
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result).toEqual({ ok: false, error: "Not authenticated." });
    });

    test("rejects when challenge is not found", async () => {
      supabaseMock = makeSupabaseMock({
        tables: { code_challenges: { maybeSingle: { data: null } } },
      });
      const result = await submitChallenge(
        "ch-missing",
        sampleCode,
        matchingActual,
      );
      expect(result).toEqual({ ok: false, error: "Challenge not found." });
    });

    test("rejects when concept is not found (even with valid challenge)", async () => {
      supabaseMock = makeSupabaseMock({
        tables: {
          code_challenges: defaultChallengeResponse(),
          concepts: { maybeSingle: { data: null } },
        },
      });
      const result = await submitChallenge(
        "ch-1",
        sampleCode,
        matchingActual,
      );
      expect(result).toEqual({ ok: false, error: "Concept not found." });
    });
  });

  describe("anthropic grader", () => {
    test("rejects when SDK client unavailable", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: validToolUseInput,
        throwInstantiation: true,
      });
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(false);
    });

    test("rejects when create() throws", async () => {
      anthropicMock = makeAnthropicMock({ throwOnCreate: true });
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(false);
    });

    test("rejects when no tool_use block", async () => {
      anthropicMock = makeAnthropicMock({
        contentOverride: [{ type: "text" }],
      });
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result).toEqual({
        ok: false,
        error: "Grader did not return a structured response.",
      });
    });

    test("rejects on invalid score range", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: { ...validToolUseInput, score: -1 },
      });
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result).toEqual({
        ok: false,
        error: "Grader returned an invalid response shape.",
      });
    });
  });

  describe("functional check + AI grade combinations", () => {
    test("functional pass + AI pass → passedTests:true, AI score returned", async () => {
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.submission.passedTests).toBe(true);
        expect(result.submission.aiScore).toBe(4.0);
      }
    });

    test("functional fail → passedTests:false and the compare reason gets injected into gaps", async () => {
      const result = await submitChallenge(
        "ch-1",
        sampleCode,
        [{ order_id: 999, amount: 0, status: "wrong" }], // doesn't match expected
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.submission.passedTests).toBe(false);
        // The compare reason ("Row 1, column ..., got ..., expected ...")
        // is prepended into the gaps array so the user sees what's wrong.
        const hasFunctionalGap = result.submission.feedback.gaps.some((g) =>
          g.startsWith("Functional check:"),
        );
        expect(hasFunctionalGap).toBe(true);
      }
    });

    test("functional pass + AI score < 3.5 → ok response, but completed depends on recompute", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: { ...validToolUseInput, score: 2.5 },
      });
      recomputeReturn = { completed: false };
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.submission.passedTests).toBe(true);
        expect(result.submission.aiScore).toBe(2.5);
        expect(result.completed).toBe(false);
      }
    });
  });

  describe("score handling", () => {
    test("snaps fractional score to nearest 0.5", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: { ...validToolUseInput, score: 3.8 },
      });
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.submission.aiScore).toBe(4.0);
    });
  });

  describe("attempt counting", () => {
    test("first attempt becomes 1", async () => {
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.submission.attemptCount).toBe(1);
    });

    test("subsequent attempt increments by 1", async () => {
      supabaseMock = makeSupabaseMock({
        user: { id: "u-1" },
        tables: {
          code_challenges: defaultChallengeResponse(),
          concepts: defaultConceptResponse(),
          user_challenge_submissions: {
            maybeSingle: { data: { attempt_count: 3 } },
            upsert: { error: null },
          },
        },
      });
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.submission.attemptCount).toBe(4);
    });
  });

  describe("db errors", () => {
    test("rejects when submission upsert fails", async () => {
      supabaseMock = makeSupabaseMock({
        user: { id: "u-1" },
        tables: {
          code_challenges: defaultChallengeResponse(),
          concepts: defaultConceptResponse(),
          user_challenge_submissions: {
            maybeSingle: { data: null },
            upsert: { error: { message: "RLS denied" } },
          },
        },
      });
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(false);
      expect(result.ok || result.error).toContain("RLS denied");
    });
  });

  describe("completion signal", () => {
    test("returns completed:true when recompute says so", async () => {
      recomputeReturn = { completed: true };
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.completed).toBe(true);
    });

    test("returns completed:false when recompute says so", async () => {
      recomputeReturn = { completed: false };
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.completed).toBe(false);
    });

    test("trims the saved code", async () => {
      const result = await submitChallenge(
        "ch-1",
        `   ${sampleCode}   `,
        matchingActual,
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.submission.code).toBe(sampleCode);
    });
  });

  describe("feedback truncation", () => {
    test("strengths/gaps truncated to 4 (matching explanation behavior)", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: {
          ...validToolUseInput,
          strengths: ["a", "b", "c", "d", "e"],
          gaps: ["1", "2", "3", "4", "5"],
        },
      });
      const result = await submitChallenge("ch-1", sampleCode, matchingActual);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.submission.feedback.strengths).toHaveLength(4);
        expect(result.submission.feedback.gaps).toHaveLength(4);
      }
    });
  });
});
