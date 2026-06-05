import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExplanationEvaluator } from "./ExplanationEvaluator";
import type { EvaluationResult, ExplanationRecord } from "./types";

afterEach(() => {
  cleanup();
});

const passingRecord: ExplanationRecord = {
  explanation: "Idempotency means a write can be retried without corrupting the data.",
  score: 4.0,
  feedback: {
    summary: "Solid grasp of the core mechanism.",
    strengths: ["Names the retry/safety relationship clearly"],
    gaps: ["Doesn't mention the design-axis aspect"],
    next_step: "Read the failure-modes concept next.",
  },
  attempt_count: 2,
  updated_at: "2026-06-04T10:00:00Z",
};

const failingRecord: ExplanationRecord = {
  ...passingRecord,
  score: 2.0,
  feedback: {
    summary: "Partial — captures some pieces but misses the why.",
    strengths: [],
    gaps: ["Doesn't explain why retries are necessary at all"],
  },
};

function mockSubmit(result: EvaluationResult) {
  return mock(() => Promise.resolve(result));
}

describe("ExplanationEvaluator", () => {
  describe("initial render — no prior submission", () => {
    test("shows the threshold hint instead of a score badge", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={null}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      expect(screen.getByText(/Needs 3.5 \/ 5 to complete/)).toBeDefined();
    });

    test("submit button reads 'Get feedback' and is disabled for short text", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={null}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      const btn = screen.getByRole("button", { name: /Get feedback/ });
      expect(btn.hasAttribute("disabled")).toBe(true);
    });

    test("shows the character count when no result yet", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={null}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      expect(screen.getByText(/0 chars/)).toBeDefined();
    });
  });

  describe("initial render — with passing prior submission", () => {
    test("shows the score badge with one decimal", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={passingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      expect(screen.getByText("4.0")).toBeDefined();
    });

    test("shows the feedback summary, strengths, gaps, and next step", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={passingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      expect(screen.getByText(/Solid grasp of the core mechanism/)).toBeDefined();
      expect(
        screen.getByText(/Names the retry\/safety relationship clearly/),
      ).toBeDefined();
      expect(
        screen.getByText(/Doesn't mention the design-axis aspect/),
      ).toBeDefined();
      expect(
        screen.getByText(/Read the failure-modes concept next/),
      ).toBeDefined();
    });

    test("shows the 'Concept complete' pass copy when passed", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={passingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      expect(screen.getByText(/Concept complete ✓/)).toBeDefined();
    });

    test("button reads 'Already graded' when text is unchanged", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={passingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      expect(
        screen.getByRole("button", { name: /Already graded/ }),
      ).toBeDefined();
    });

    test("relabels gaps as 'Where you could go deeper' on a passing record", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={passingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      expect(screen.getByText(/Where you could go deeper/)).toBeDefined();
    });
  });

  describe("initial render — with failing prior submission", () => {
    test("labels gaps as 'Gaps' (not the passing language)", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={failingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      const list = screen.getAllByText(/^Gaps$/);
      expect(list.length).toBeGreaterThan(0);
    });

    test("shows the below-threshold copy", () => {
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={failingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      expect(
        screen.getByText(/Score below 3.5 — refine your explanation/),
      ).toBeDefined();
    });
  });

  describe("editing after a prior submission", () => {
    test("button switches to 'Reevaluate' when text differs from saved record", async () => {
      const user = userEvent.setup();
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={passingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      await user.type(textarea, " — and it's a design axis.");
      expect(
        screen.getByRole("button", { name: /Reevaluate/ }),
      ).toBeDefined();
    });

    test("shows 'unsaved changes' hint when dirty", async () => {
      const user = userEvent.setup();
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={passingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      await user.type(textarea, " extra");
      expect(screen.getByText(/unsaved changes/)).toBeDefined();
    });

    test("hides the feedback block while dirty (re-shown after reeval)", async () => {
      const user = userEvent.setup();
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={passingRecord}
          onSubmit={mockSubmit({ ok: false, error: "n/a" })}
        />,
      );
      // Sanity: feedback is visible initially.
      expect(
        screen.queryByText(/Solid grasp of the core mechanism/),
      ).not.toBeNull();
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      await user.type(textarea, " extra");
      expect(
        screen.queryByText(/Solid grasp of the core mechanism/),
      ).toBeNull();
    });
  });

  describe("submit flow", () => {
    test("submit calls onSubmit with conceptId and text, then renders the new record", async () => {
      const user = userEvent.setup();
      const submit = mock(
        async (_id: string, _text: string): Promise<EvaluationResult> => ({
          ok: true,
          completed: true,
          record: {
            explanation: "A typed-enough explanation to clear the minimum length requirement.",
            score: 3.5,
            feedback: {
              summary: "Just enough to pass.",
              strengths: [],
              gaps: [],
            },
            attempt_count: 1,
            updated_at: "2026-06-04T11:00:00Z",
          },
        }),
      );
      render(
        <ExplanationEvaluator
          conceptId="c-99"
          initialRecord={null}
          onSubmit={submit}
        />,
      );
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      await user.type(
        textarea,
        "A typed-enough explanation to clear the minimum length requirement.",
      );
      const btn = screen.getByRole("button", { name: /Get feedback/ });
      expect(btn.hasAttribute("disabled")).toBe(false);
      await user.click(btn);

      expect(submit).toHaveBeenCalledTimes(1);
      const [calledId, calledText] = submit.mock.calls[0]!;
      expect(calledId).toBe("c-99");
      expect(typeof calledText).toBe("string");
      expect((calledText as string).length).toBeGreaterThan(30);
      // New record renders
      expect(screen.getByText("3.5")).toBeDefined();
      expect(screen.getByText(/Just enough to pass/)).toBeDefined();
    });

    test("renders error from the action without overwriting the record", async () => {
      const user = userEvent.setup();
      const submit = mock(
        async (): Promise<EvaluationResult> => ({
          ok: false,
          error: "Grader returned an invalid response shape.",
        }),
      );
      render(
        <ExplanationEvaluator
          conceptId="c-1"
          initialRecord={passingRecord}
          onSubmit={submit}
        />,
      );
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      await user.type(textarea, " edit");
      const btn = screen.getByRole("button", { name: /Reevaluate/ });
      await user.click(btn);

      expect(
        screen.getByText(/Grader returned an invalid response shape/),
      ).toBeDefined();
      // Old score still visible (record not overwritten).
      expect(screen.getByText("4.0")).toBeDefined();
    });
  });
});
