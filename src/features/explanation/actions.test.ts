import {
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

// ─────────────────────────────────────────────────────────────────────
// Mutable mocks. The mock.module() factories below close over these
// references and read them at call time, so reassigning in beforeEach
// works (and is needed for per-test customization).
// ─────────────────────────────────────────────────────────────────────

type TableResponses = {
  maybeSingle?: { data: unknown; error?: unknown };
  order?: { data: unknown; error?: unknown };
  upsert?: { error?: unknown };
};

type SupabaseLike = ReturnType<typeof makeSupabaseMock>;

function makeSupabaseMock(opts: {
  user?: { id: string } | null;
  tables?: Record<string, TableResponses>;
}) {
  const tables = opts.tables ?? {};
  // ?? coalesces null too — so an explicit `user: null` from a test must
  // override the default. Use `in` to distinguish "not set" from "null".
  const user = "user" in opts ? opts.user : { id: "u-1" };
  return {
    auth: {
      getUser: async () => ({ data: { user } }),
    },
    from: (table: string) => {
      const r = tables[table] ?? {};
      const chain: Record<string, unknown> = {};
      // Chainable methods return the chain itself so subsequent .eq().eq() works.
      const chainable = ["select", "eq", "in", "neq"];
      for (const m of chainable) chain[m] = () => chain;
      // Terminal methods return a configured response promise.
      chain.maybeSingle = async () =>
        r.maybeSingle ?? { data: null, error: null };
      chain.order = async () => r.order ?? { data: [], error: null };
      chain.upsert = async () => r.upsert ?? { error: null };
      return chain;
    },
  };
}

// Anthropic mock — returns whatever toolUseInput the test configures.
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

let supabaseMock: SupabaseLike;
let anthropicMock: ReturnType<typeof makeAnthropicMock>;
let recomputeReturn: { completed: boolean } = { completed: false };

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

// Import AFTER mocks are registered.
const { submitExplanation } = await import("./actions");

const validExplanation =
  "Idempotency means a write can be retried without corrupting the data, which is what makes safe pipeline reruns possible.";

const validToolUseInput = {
  score: 4.0,
  summary: "Solid grasp of the core mechanism.",
  strengths: ["Names the retry/safety relationship clearly"],
  gaps: ["Doesn't mention the design-axis aspect"],
  next_step: "Read failure-modes next.",
};

beforeEach(() => {
  // Defaults: authed user, concept exists, no prior attempt, anthropic returns
  // a valid tool_use, completion returns not completed.
  supabaseMock = makeSupabaseMock({
    user: { id: "u-1" },
    tables: {
      concepts: {
        maybeSingle: {
          data: {
            id: "c-1",
            slug: "idempotency",
            title: "Idempotency",
            description: "...",
            swe_analogy: "...",
            phases: { number: 3, title: "Movement", tagline: null },
          },
        },
      },
      concept_sections: {
        order: { data: [] },
      },
      concept_explanations: {
        maybeSingle: { data: null }, // no prior attempt
        upsert: { error: null },
      },
    },
  });
  anthropicMock = makeAnthropicMock({ toolUseInput: validToolUseInput });
  recomputeReturn = { completed: true };
});

describe("submitExplanation", () => {
  describe("validation", () => {
    test("rejects too-short input", async () => {
      const result = await submitExplanation("c-1", "too short");
      expect(result).toEqual({
        ok: false,
        error: "Please write at least 30 characters before submitting.",
      });
    });

    test("rejects whitespace-only input as too short", async () => {
      const result = await submitExplanation("c-1", "    \n   ");
      expect(result.ok).toBe(false);
    });

    test("rejects too-long input", async () => {
      const result = await submitExplanation(
        "c-1",
        "x".repeat(4001),
      );
      expect(result).toEqual({
        ok: false,
        error: "Please keep your explanation under 4000 characters.",
      });
    });

    test("accepts exactly the minimum length", async () => {
      const result = await submitExplanation("c-1", "x".repeat(30));
      expect(result.ok).toBe(true);
    });
  });

  describe("auth and concept lookup", () => {
    test("rejects when no user is signed in", async () => {
      supabaseMock = makeSupabaseMock({ user: null });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result).toEqual({ ok: false, error: "Not authenticated." });
    });

    test("rejects when concept is not found", async () => {
      supabaseMock = makeSupabaseMock({
        tables: {
          concepts: { maybeSingle: { data: null } },
        },
      });
      const result = await submitExplanation("c-missing", validExplanation);
      expect(result).toEqual({ ok: false, error: "Concept not found." });
    });

    test("rejects when concept query errors", async () => {
      supabaseMock = makeSupabaseMock({
        tables: {
          concepts: {
            maybeSingle: { data: null, error: { message: "db down" } },
          },
        },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(false);
    });
  });

  describe("anthropic grader", () => {
    test("rejects when the SDK client can't be instantiated", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: validToolUseInput,
        throwInstantiation: true,
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(false);
      expect(result.ok || result.error).toContain("ANTHROPIC_API_KEY");
    });

    test("rejects when the API call throws", async () => {
      anthropicMock = makeAnthropicMock({ throwOnCreate: true });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(false);
      expect(result.ok || result.error).toContain("anthropic network error");
    });

    test("rejects when response contains no tool_use block", async () => {
      anthropicMock = makeAnthropicMock({
        contentOverride: [{ type: "text" }],
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result).toEqual({
        ok: false,
        error: "Grader did not return a structured response.",
      });
    });

    test("rejects when score is out of range", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: { ...validToolUseInput, score: 7 },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result).toEqual({
        ok: false,
        error: "Grader returned an invalid response shape.",
      });
    });

    test("rejects when strengths is not an array", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: { ...validToolUseInput, strengths: "not-an-array" },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result).toEqual({
        ok: false,
        error: "Grader returned an invalid response shape.",
      });
    });

    test("rejects when summary is missing", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: { score: 4, strengths: [], gaps: [] },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(false);
    });
  });

  describe("score handling", () => {
    test("snaps 3.7 down to 3.5 (nearest 0.5)", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: { ...validToolUseInput, score: 3.7 },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.record.score).toBe(3.5);
    });

    test("snaps 4.3 up to 4.5", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: { ...validToolUseInput, score: 4.3 },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.record.score).toBe(4.5);
    });

    test("preserves exact 3.5 / 4.0 / 5.0 scores", async () => {
      for (const score of [3.5, 4.0, 5.0]) {
        anthropicMock = makeAnthropicMock({
          toolUseInput: { ...validToolUseInput, score },
        });
        const result = await submitExplanation("c-1", validExplanation);
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.record.score).toBe(score);
      }
    });
  });

  describe("feedback truncation", () => {
    test("truncates strengths to 4 items", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: {
          ...validToolUseInput,
          strengths: ["a", "b", "c", "d", "e", "f"],
        },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(true);
      if (result.ok)
        expect(result.record.feedback.strengths).toEqual([
          "a",
          "b",
          "c",
          "d",
        ]);
    });

    test("truncates gaps to 4 items", async () => {
      anthropicMock = makeAnthropicMock({
        toolUseInput: {
          ...validToolUseInput,
          gaps: ["1", "2", "3", "4", "5"],
        },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(true);
      if (result.ok)
        expect(result.record.feedback.gaps).toEqual([
          "1",
          "2",
          "3",
          "4",
        ]);
    });
  });

  describe("attempt counting", () => {
    test("first attempt becomes attempt_count = 1", async () => {
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.record.attempt_count).toBe(1);
    });

    test("subsequent attempt increments by 1", async () => {
      supabaseMock = makeSupabaseMock({
        user: { id: "u-1" },
        tables: {
          concepts: {
            maybeSingle: {
              data: {
                id: "c-1",
                slug: "idempotency",
                title: "Idempotency",
                description: "...",
                swe_analogy: "...",
                phases: { number: 3, title: "Movement", tagline: null },
              },
            },
          },
          concept_sections: { order: { data: [] } },
          concept_explanations: {
            maybeSingle: { data: { attempt_count: 4 } },
            upsert: { error: null },
          },
        },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.record.attempt_count).toBe(5);
    });
  });

  describe("db errors", () => {
    test("rejects when upsert fails", async () => {
      supabaseMock = makeSupabaseMock({
        user: { id: "u-1" },
        tables: {
          concepts: {
            maybeSingle: {
              data: {
                id: "c-1",
                slug: "idempotency",
                title: "Idempotency",
                description: "...",
                swe_analogy: "...",
                phases: { number: 3, title: "Movement", tagline: null },
              },
            },
          },
          concept_sections: { order: { data: [] } },
          concept_explanations: {
            maybeSingle: { data: null },
            upsert: { error: { message: "RLS denied" } },
          },
        },
      });
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(false);
      expect(result.ok || result.error).toContain("RLS denied");
    });
  });

  describe("happy path completion signal", () => {
    test("returns completed: true when recompute says yes", async () => {
      recomputeReturn = { completed: true };
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.completed).toBe(true);
    });

    test("returns completed: false when recompute says no", async () => {
      recomputeReturn = { completed: false };
      const result = await submitExplanation("c-1", validExplanation);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.completed).toBe(false);
    });

    test("passes through the explanation text, trimmed", async () => {
      const result = await submitExplanation(
        "c-1",
        `  ${validExplanation}  `,
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.record.explanation).toBe(validExplanation);
    });
  });
});
