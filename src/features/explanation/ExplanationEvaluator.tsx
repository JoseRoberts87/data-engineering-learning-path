"use client";

import { useState, useTransition } from "react";
import type {
  EvaluationResult,
  ExplanationRecord,
} from "./types";
import { COMPLETION_THRESHOLD } from "./types";

type Props = {
  conceptId: string;
  initialRecord: ExplanationRecord | null;
  onSubmit: (
    conceptId: string,
    explanation: string,
  ) => Promise<EvaluationResult>;
};

export function ExplanationEvaluator({
  conceptId,
  initialRecord,
  onSubmit,
}: Props) {
  const [text, setText] = useState(initialRecord?.explanation ?? "");
  const [record, setRecord] = useState<ExplanationRecord | null>(initialRecord);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const passed = record !== null && record.score >= COMPLETION_THRESHOLD;
  const dirty = record !== null && text.trim() !== record.explanation.trim();
  const hasResult = record !== null;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await onSubmit(conceptId, text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRecord(result.record);
    });
  }

  const tone = passed
    ? "border-emerald-700/40 bg-emerald-700/[0.04]"
    : hasResult
      ? "border-amber-700/40 bg-amber-700/[0.04]"
      : "border-foreground/15";

  return (
    <section className={`mt-10 rounded-lg border ${tone} p-5 transition`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
          Explain it in your own words
        </h2>
        {hasResult ? (
          <ScoreBadge score={record!.score} passed={passed} />
        ) : (
          <span className="text-xs text-foreground/50">
            Needs {COMPLETION_THRESHOLD.toFixed(1)} / 5 to complete
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-foreground/60">
        Write your own explanation of this concept. An AI tutor that has
        mastered the full curriculum will grade your understanding.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="What is this concept really about? Why does it matter? What's the failure it prevents, or the trade-off it resolves?"
        disabled={pending}
        className="mt-3 w-full resize-y rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm leading-relaxed shadow-inner placeholder:text-foreground/30 focus:border-foreground/40 focus:outline-none disabled:opacity-60"
      />

      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-xs text-foreground/50">
          {hasResult ? (
            <>
              Attempt {record!.attempt_count}
              {dirty ? " · unsaved changes" : ""}
            </>
          ) : (
            <>{text.trim().length} chars</>
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || text.trim().length < 30}
          className="rounded-md bg-foreground px-4 py-1.5 text-sm font-medium text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending
            ? "Grading…"
            : hasResult
              ? dirty
                ? "Reevaluate"
                : "Already graded"
              : "Get feedback"}
        </button>
      </div>

      {hasResult && !dirty ? (
        <FeedbackBlock record={record!} passed={passed} />
      ) : null}
    </section>
  );
}

function ScoreBadge({
  score,
  passed,
}: {
  score: number;
  passed: boolean;
}) {
  const color = passed
    ? "border-emerald-700/40 bg-emerald-700/10 text-emerald-700 dark:text-emerald-400"
    : "border-amber-700/40 bg-amber-700/10 text-amber-700 dark:text-amber-400";
  return (
    <div
      className={`inline-flex items-baseline gap-1 rounded-full border px-3 py-0.5 text-sm font-semibold ${color}`}
    >
      <span className="tabular-nums">{score.toFixed(1)}</span>
      <span className="text-xs text-foreground/50">/ 5</span>
    </div>
  );
}

function FeedbackBlock({
  record,
  passed,
}: {
  record: ExplanationRecord;
  passed: boolean;
}) {
  return (
    <div className="mt-4 space-y-3 text-sm">
      <div className="flex items-start gap-2 text-foreground/80">
        <span className="mt-0.5 select-none text-foreground/40">→</span>
        <p>{record.feedback.summary}</p>
      </div>

      {record.feedback.strengths.length > 0 && (
        <FeedbackList
          title="Strengths"
          items={record.feedback.strengths}
          tone="positive"
        />
      )}
      {record.feedback.gaps.length > 0 && (
        <FeedbackList
          title={passed ? "Where you could go deeper" : "Gaps"}
          items={record.feedback.gaps}
          tone="warn"
        />
      )}
      {record.feedback.next_step ? (
        <div className="rounded-md border border-foreground/10 bg-foreground/[0.02] p-3">
          <div className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            Next step
          </div>
          <p className="mt-1 text-sm text-foreground/80">
            {record.feedback.next_step}
          </p>
        </div>
      ) : null}

      <p className="pt-1 text-xs text-foreground/50">
        {passed
          ? "Concept complete ✓ — Edit and reevaluate to refine your understanding."
          : `Score below ${COMPLETION_THRESHOLD.toFixed(1)} — refine your explanation and try again.`}
      </p>
    </div>
  );
}

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "warn";
}) {
  const marker = tone === "positive" ? "✓" : "·";
  const color = tone === "positive" ? "text-emerald-700/80" : "text-amber-700/80";
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-foreground/50">
        {title}
      </div>
      <ul className="mt-1.5 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/80">
            <span className={`select-none ${color}`}>{marker}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
