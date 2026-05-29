"use client";

import { useState } from "react";
import type { InlineQuizPayload } from "./types";

export function InlineQuiz({ payload }: { payload: InlineQuizPayload }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const correctId = payload.options.find((o) => o.correct)?.id;

  function reset() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <section className="mt-8 rounded-lg border border-foreground/15 bg-foreground/[0.03] p-5">
      <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
        Check yourself
      </div>
      <p className="mt-2 text-base">{payload.prompt}</p>
      <div className="mt-4 space-y-2">
        {payload.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === correctId;
          let marker = "○";
          let style = "border-foreground/15 hover:border-foreground/30";
          if (submitted) {
            if (isCorrect) {
              marker = "✓";
              style = "border-green-700/40 bg-green-700/5";
            } else if (isSelected) {
              marker = "✗";
              style = "border-red-700/40 bg-red-700/5";
            }
          } else if (isSelected) {
            marker = "●";
            style = "border-foreground/40 bg-foreground/5";
          }
          return (
            <label
              key={opt.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${style} ${
                submitted ? "cursor-default" : ""
              }`}
            >
              <input
                type="radio"
                name={`quiz-${payload.prompt.slice(0, 16)}`}
                value={opt.id}
                checked={isSelected}
                onChange={() => !submitted && setSelected(opt.id)}
                disabled={submitted}
                className="sr-only"
              />
              <span className="select-none font-mono">{marker}</span>
              <span className="flex-1">{opt.text}</span>
            </label>
          );
        })}
      </div>

      {submitted ? (
        <div className="mt-4">
          <p className="rounded-md bg-foreground/5 p-3 text-sm text-foreground/85">
            <span className="font-semibold">Why: </span>
            {payload.explanation}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 text-xs text-foreground/60 underline hover:text-foreground"
          >
            Try again
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={!selected}
          className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          Check answer
        </button>
      )}
    </section>
  );
}
