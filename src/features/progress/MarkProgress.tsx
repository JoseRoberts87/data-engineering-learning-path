"use client";

import { useOptimistic, useTransition } from "react";
import type { ProgressStatus } from "./actions";

const options: { value: ProgressStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Complete" },
];

export function MarkProgress({
  initialStatus,
  onChange,
}: {
  initialStatus: ProgressStatus;
  onChange: (status: ProgressStatus) => Promise<void>;
}) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<
    ProgressStatus,
    ProgressStatus
  >(initialStatus, (_, next) => next);
  const [isPending, startTransition] = useTransition();

  function handle(next: ProgressStatus) {
    if (next === optimisticStatus) return;
    startTransition(async () => {
      setOptimisticStatus(next);
      await onChange(next);
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Progress"
      className="inline-flex overflow-hidden rounded-full border border-foreground/20 text-xs"
    >
      {options.map((opt) => {
        const active = optimisticStatus === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={isPending}
            onClick={() => handle(opt.value)}
            className={`px-3 py-1 transition ${
              active
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-foreground/5"
            } disabled:opacity-60`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
