import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPhasesWithProgress } from "@/features/path/queries";
import { PhaseCard } from "@/features/path/PhaseCard";

export default async function PathPage() {
  const supabase = await createClient();
  const phases = await getPhasesWithProgress(supabase);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Your learning path</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Seven phases, concept-first. Each concept is framed against a software
        engineering practice you already know.
      </p>

      <div className="mt-8 space-y-3">
        {phases.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </div>

      <Link
        href="/connections"
        className="mt-6 block rounded-lg border border-foreground/15 p-5 transition hover:border-foreground/40 hover:bg-foreground/[0.02]"
      >
        <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
          Concept map
        </div>
        <div className="mt-1 text-base font-semibold">
          See how concepts connect across phases
        </div>
        <div className="mt-1 text-sm text-foreground/60">
          The same ideas (idempotency, time, the log abstraction, cost-as-bytes)
          recur across phases. Open the interactive graph to trace the threads.
        </div>
      </Link>
    </div>
  );
}
