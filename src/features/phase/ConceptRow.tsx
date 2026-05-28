import Link from "next/link";
import type { PhaseConcept } from "./queries";

const statusMark: Record<PhaseConcept["status"], string> = {
  not_started: "○",
  in_progress: "◐",
  completed: "●",
};

const statusLabel: Record<PhaseConcept["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Complete",
};

export function ConceptRow({ concept }: { concept: PhaseConcept }) {
  return (
    <Link
      href={`/concept/${concept.slug}`}
      className="flex items-start gap-4 rounded-md border border-foreground/10 p-4 transition hover:border-foreground/30 hover:bg-foreground/[0.02]"
    >
      <span
        className="mt-0.5 select-none font-mono text-base text-foreground/70"
        aria-label={statusLabel[concept.status]}
        title={statusLabel[concept.status]}
      >
        {statusMark[concept.status]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{concept.title}</div>
        <p className="mt-1 line-clamp-2 text-sm text-foreground/60">
          {concept.description}
        </p>
      </div>
    </Link>
  );
}
