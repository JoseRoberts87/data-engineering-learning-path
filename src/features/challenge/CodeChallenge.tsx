"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";
import {
  executeUserSql,
  openConnectionWithFixture,
} from "./duckdb";
import type {
  ChallengeContent,
  ChallengeSubmission,
  SubmissionResult,
} from "./types";
import { CHALLENGE_PASS_THRESHOLD } from "./types";

type Props = {
  challenge: ChallengeContent;
  initialSubmission: ChallengeSubmission | null;
  onSubmit: (
    challengeId: string,
    code: string,
    actualResult: Array<Record<string, unknown>>,
  ) => Promise<SubmissionResult>;
};

type RunState =
  | { kind: "idle" }
  | { kind: "running" }
  | {
      kind: "result";
      columns: string[];
      rows: Array<Record<string, unknown>>;
    }
  | { kind: "error"; message: string };

export function CodeChallenge({
  challenge,
  initialSubmission,
  onSubmit,
}: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [code, setCode] = useState(
    initialSubmission?.code ?? challenge.starterSql,
  );
  const [run, setRun] = useState<RunState>({ kind: "idle" });
  const [submission, setSubmission] = useState(initialSubmission);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const lastRunResult = useRef<Array<Record<string, unknown>> | null>(
    initialSubmission ? null : null,
  );

  const passed = submission?.passedTests === true && submission.aiScore >= CHALLENGE_PASS_THRESHOLD;
  const dirty = submission !== null && code !== submission.code;

  const handleRun = useCallback(async () => {
    setRun({ kind: "running" });
    setSubmitError(null);
    try {
      const conn = await openConnectionWithFixture(challenge.fixtureSql);
      try {
        const { columns, rows } = await executeUserSql(conn, code);
        lastRunResult.current = rows;
        setRun({ kind: "result", columns, rows });
      } finally {
        await conn.close();
      }
    } catch (e) {
      lastRunResult.current = null;
      setRun({
        kind: "error",
        message: e instanceof Error ? e.message : "Query failed.",
      });
    }
  }, [challenge.fixtureSql, code]);

  const handleSubmit = useCallback(() => {
    if (!lastRunResult.current) {
      setSubmitError("Run the query first so we have a result to submit.");
      return;
    }
    setSubmitError(null);
    startTransition(async () => {
      const result = await onSubmit(
        challenge.id,
        code,
        lastRunResult.current ?? [],
      );
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setSubmission(result.submission);
    });
  }, [challenge.id, code, onSubmit]);

  const tone = passed
    ? "border-emerald-700/40 bg-emerald-700/[0.04]"
    : submission !== null
      ? "border-amber-700/40 bg-amber-700/[0.04]"
      : "border-foreground/15";

  return (
    <section className={`mt-10 rounded-lg border ${tone} p-5 transition`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
          Code challenge
        </h2>
        {submission ? (
          <ScoreBadge
            score={submission.aiScore}
            passed={passed}
            passedTests={submission.passedTests}
          />
        ) : (
          <span className="text-xs text-foreground/50">
            Needs functional pass + {CHALLENGE_PASS_THRESHOLD.toFixed(1)} / 5
          </span>
        )}
      </div>

      <div className="mt-2 text-sm text-foreground/80">{challenge.prompt}</div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-foreground/50 hover:text-foreground/80">
          Show fixture data
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-md border border-foreground/10 bg-foreground/[0.03] p-3 text-[11px] leading-relaxed">
          {challenge.fixtureSql}
        </pre>
      </details>

      <div className="mt-4 overflow-hidden rounded-md border border-foreground/15">
        <CodeMirror
          value={code}
          onChange={(v) => setCode(v)}
          theme={isDark ? oneDark : "light"}
          extensions={[sql({ dialect: PostgreSQL })]}
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
          }}
          height="220px"
        />
      </div>

      {challenge.hints.length > 0 ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setHintsOpen((v) => !v)}
            className="text-xs text-foreground/50 underline hover:text-foreground/80"
          >
            {hintsOpen ? "Hide hints" : "Show hints"}
          </button>
          {hintsOpen ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/70">
              {challenge.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={run.kind === "running" || pending}
          className="rounded-md border border-foreground/30 px-3 py-1.5 text-xs font-medium hover:bg-foreground/5 disabled:opacity-50"
        >
          {run.kind === "running" ? "Running…" : "Run"}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending || run.kind !== "result" || dirty === false && submission !== null && passed}
          className="rounded-md bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending
            ? "Grading…"
            : submission
              ? dirty || !passed
                ? "Submit again"
                : "Submitted ✓"
              : "Submit"}
        </button>
        <div className="ml-auto text-xs text-foreground/40">
          {submission ? `Attempt ${submission.attemptCount}` : null}
        </div>
      </div>

      {submitError ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {submitError}
        </p>
      ) : null}

      <RunPanel state={run} />

      {submission && !dirty ? (
        <FeedbackBlock submission={submission} passed={passed} />
      ) : null}
    </section>
  );
}

function ScoreBadge({
  score,
  passed,
  passedTests,
}: {
  score: number;
  passed: boolean;
  passedTests: boolean;
}) {
  const color = passed
    ? "border-emerald-700/40 bg-emerald-700/10 text-emerald-700 dark:text-emerald-400"
    : "border-amber-700/40 bg-amber-700/10 text-amber-700 dark:text-amber-400";
  return (
    <div
      className={`inline-flex items-baseline gap-2 rounded-full border px-3 py-0.5 text-sm font-semibold ${color}`}
    >
      <span className="tabular-nums">{score.toFixed(1)}</span>
      <span className="text-xs text-foreground/50">/ 5</span>
      <span
        className={`text-[10px] uppercase tracking-wide ${
          passedTests ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {passedTests ? "tests pass" : "tests fail"}
      </span>
    </div>
  );
}

function RunPanel({ state }: { state: RunState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "running") {
    return (
      <p className="mt-3 text-xs text-foreground/60">Loading DuckDB-WASM…</p>
    );
  }
  if (state.kind === "error") {
    return (
      <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/[0.04] p-3 text-xs">
        <div className="font-medium text-red-700 dark:text-red-400">
          Query error
        </div>
        <pre className="mt-1 whitespace-pre-wrap text-red-700/80 dark:text-red-300">
          {state.message}
        </pre>
      </div>
    );
  }
  return (
    <div className="mt-3">
      <div className="mb-1 text-xs text-foreground/50">
        Result · {state.rows.length} row{state.rows.length === 1 ? "" : "s"}
      </div>
      <div className="overflow-x-auto rounded-md border border-foreground/10">
        <table className="w-full text-xs">
          <thead className="bg-foreground/[0.04]">
            <tr>
              {state.columns.map((c) => (
                <th
                  key={c}
                  className="px-2.5 py-1.5 text-left font-semibold text-foreground/70"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.rows.slice(0, 50).map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 1 ? "bg-foreground/[0.02]" : undefined}
              >
                {state.columns.map((c) => (
                  <td
                    key={c}
                    className="px-2.5 py-1 font-mono text-foreground/80"
                  >
                    {formatCell(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {state.rows.length > 50 ? (
          <div className="border-t border-foreground/10 px-2.5 py-1 text-[11px] text-foreground/40">
            Showing first 50 rows
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function FeedbackBlock({
  submission,
  passed,
}: {
  submission: ChallengeSubmission;
  passed: boolean;
}) {
  return (
    <div className="mt-4 space-y-3 text-sm">
      <div className="flex items-start gap-2 text-foreground/80">
        <span className="mt-0.5 select-none text-foreground/40">→</span>
        <p>{submission.feedback.summary}</p>
      </div>
      {submission.feedback.strengths.length > 0 && (
        <FeedbackList
          title="Strengths"
          items={submission.feedback.strengths}
          tone="positive"
        />
      )}
      {submission.feedback.gaps.length > 0 && (
        <FeedbackList
          title={passed ? "Where you could go deeper" : "Gaps"}
          items={submission.feedback.gaps}
          tone="warn"
        />
      )}
      {submission.feedback.next_step ? (
        <div className="rounded-md border border-foreground/10 bg-foreground/[0.02] p-3">
          <div className="text-xs font-medium uppercase tracking-wider text-foreground/50">
            Next step
          </div>
          <p className="mt-1 text-sm text-foreground/80">
            {submission.feedback.next_step}
          </p>
        </div>
      ) : null}
      <p className="pt-1 text-xs text-foreground/50">
        {passed
          ? "Challenge passed ✓ — code + understanding both confirmed."
          : submission.passedTests
            ? "Functional check passed, but the AI grader thinks your approach can be sharper. Refine and resubmit."
            : "Functional check failed. Refine your query, run it again, and resubmit."}
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
  const color =
    tone === "positive" ? "text-emerald-700/80" : "text-amber-700/80";
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
