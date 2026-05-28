"use client";

import { useMemo, useState, useTransition } from "react";
import { submitQuizAttempt } from "./actions";
import type { CheckpointQuestion } from "./queries";

type Props = {
  checkpointId: string;
  passScore: number;
  questions: CheckpointQuestion[];
};

type Phase = "answering" | "submitting" | "results" | "error";

export function QuizForm({ checkpointId, passScore, questions }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("answering");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const allAnswered = questions.every((q) => answers[q.id]);

  const { score, correctCount, passed } = useMemo(() => {
    if (phase !== "results") {
      return { score: 0, correctCount: 0, passed: false };
    }
    let correct = 0;
    for (const q of questions) {
      const userAnswer = answers[q.id];
      const correctOption = q.options.find((o) => o.correct);
      if (userAnswer === correctOption?.id) correct++;
    }
    const pct = Math.round((correct / questions.length) * 100);
    return {
      score: pct,
      correctCount: correct,
      passed: pct >= passScore,
    };
  }, [phase, questions, answers, passScore]);

  function select(questionId: string, optionId: string) {
    if (phase !== "answering") return;
    setAnswers((a) => ({ ...a, [questionId]: optionId }));
  }

  function submit() {
    if (!allAnswered) return;
    let correct = 0;
    for (const q of questions) {
      const userAnswer = answers[q.id];
      const correctOption = q.options.find((o) => o.correct);
      if (userAnswer === correctOption?.id) correct++;
    }
    const pct = Math.round((correct / questions.length) * 100);
    const didPass = pct >= passScore;

    setPhase("submitting");
    startTransition(async () => {
      try {
        await submitQuizAttempt({
          checkpointId,
          answers,
          score: pct,
          passed: didPass,
        });
        setPhase("results");
      } catch (e) {
        setPhase("error");
        setErrorMsg(e instanceof Error ? e.message : "Submit failed");
      }
    });
  }

  function retake() {
    setAnswers({});
    setPhase("answering");
    setErrorMsg("");
  }

  return (
    <div className="space-y-8">
      {phase === "results" && (
        <div
          className={`rounded-md border p-4 ${
            passed
              ? "border-green-700/30 bg-green-700/10"
              : "border-yellow-600/30 bg-yellow-600/10"
          }`}
        >
          <div className="text-base font-semibold">
            {passed ? "Passed" : "Did not pass"} — {correctCount} / {questions.length} correct ({score}%)
          </div>
          <p className="mt-1 text-sm text-foreground/70">
            {passed
              ? "Phase validated. You can revisit any time."
              : `Need ${passScore}% to pass. Review the explanations below and try again.`}
          </p>
        </div>
      )}

      {questions.map((q, i) => {
        const userAnswer = answers[q.id];
        const correctId = q.options.find((o) => o.correct)?.id;
        const showResults = phase === "results";

        return (
          <fieldset key={q.id} className="space-y-3">
            <legend className="text-xs font-mono uppercase tracking-wider text-foreground/50">
              Question {i + 1} of {questions.length}
            </legend>
            <p className="text-base">{q.prompt}</p>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = userAnswer === opt.id;
                const isCorrect = opt.id === correctId;
                let marker = "○";
                let style = "border-foreground/15";
                if (showResults) {
                  if (isCorrect) {
                    marker = "✓";
                    style = "border-green-700/40 bg-green-700/5";
                  } else if (selected) {
                    marker = "✗";
                    style = "border-red-700/40 bg-red-700/5";
                  }
                } else if (selected) {
                  marker = "●";
                  style = "border-foreground/40 bg-foreground/5";
                }
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${style} ${
                      phase === "answering"
                        ? "hover:border-foreground/30"
                        : "cursor-default"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.id}
                      checked={selected}
                      onChange={() => select(q.id, opt.id)}
                      disabled={phase !== "answering"}
                      className="sr-only"
                    />
                    <span className="select-none font-mono">{marker}</span>
                    <span className="flex-1">{opt.text}</span>
                  </label>
                );
              })}
            </div>
            {showResults && q.explanation && (
              <p className="rounded-md bg-foreground/5 p-3 text-sm text-foreground/80">
                <span className="font-semibold">Why: </span>
                {q.explanation}
              </p>
            )}
          </fieldset>
        );
      })}

      {phase === "error" && (
        <p className="text-sm text-red-600">Save failed: {errorMsg}</p>
      )}

      <div className="flex items-center gap-3">
        {phase === "results" ? (
          <button
            type="button"
            onClick={retake}
            className="rounded-md border border-foreground/20 px-4 py-2 text-sm hover:bg-foreground/5"
          >
            Retake
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered || isPending || phase === "submitting"}
            className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {phase === "submitting" ? "Submitting…" : "Submit"}
          </button>
        )}
        {phase === "answering" && !allAnswered && (
          <span className="text-xs text-foreground/50">
            Answer every question to submit.
          </span>
        )}
      </div>
    </div>
  );
}
