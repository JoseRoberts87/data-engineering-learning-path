import Link from "next/link";
import type { PhaseWithProgress } from "./queries";

export function PhaseCard({ phase }: { phase: PhaseWithProgress }) {
  const pct = phase.total === 0 ? 0 : Math.round((phase.completed / phase.total) * 100);

  return (
    <Link
      href={`/phase/${phase.slug}`}
      className="block rounded-lg border border-foreground/10 p-5 transition hover:border-foreground/30 hover:bg-foreground/[0.02]"
    >
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
            Phase {phase.number}
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {phase.title}
          </h2>
          {phase.tagline && (
            <p className="mt-1 text-sm italic text-foreground/60">
              {phase.tagline}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm tabular-nums text-foreground/70">
            {phase.completed} / {phase.total}
          </div>
          <div className="text-xs text-foreground/50">complete</div>
        </div>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full bg-foreground/70 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  );
}
