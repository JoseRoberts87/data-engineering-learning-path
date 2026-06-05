import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPhaseWithConcepts } from "@/features/phase/queries";
import { ConceptRow } from "@/features/phase/ConceptRow";
import { getCheckpointSummaryForPhase } from "@/features/checkpoint/queries";
import { formatMinutes } from "@/lib/format";

export default async function PhasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const phase = await getPhaseWithConcepts(supabase, slug);
  if (!phase) notFound();
  const checkpoint = await getCheckpointSummaryForPhase(supabase, phase.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/path"
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        ← Back to path
      </Link>

      <div className="mt-4">
        <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
          Phase {phase.number}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {phase.title}
        </h1>
        {phase.tagline && (
          <p className="mt-1 text-base italic text-foreground/60">
            {phase.tagline}
          </p>
        )}
      </div>

      <div className="mt-8 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Concepts
        </h2>
        <div className="text-xs tabular-nums text-foreground/50">
          {phase.concepts.length} concepts · {formatMinutes(phase.estimatedMinutes)}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {phase.concepts.map((c) => (
          <ConceptRow key={c.id} concept={c} />
        ))}
      </div>

      {checkpoint && (
        <div className="mt-8">
          <Link
            href={`/checkpoint/${phase.slug}`}
            className="block rounded-md border border-foreground/15 p-4 transition hover:border-foreground/40 hover:bg-foreground/[0.02]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">
                  Phase {phase.number} checkpoint
                </div>
                <p className="mt-1 text-sm text-foreground/60">
                  {checkpoint.passed
                    ? `Passed — best score ${checkpoint.bestScore}%. Click to retake.`
                    : checkpoint.bestScore !== null
                      ? `Last attempt: ${checkpoint.bestScore}%. Click to retry.`
                      : "Validate your understanding of this phase with a short quiz."}
                </p>
              </div>
              {checkpoint.passed && (
                <span className="shrink-0 rounded-full border border-green-700/40 bg-green-700/10 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Passed
                </span>
              )}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
