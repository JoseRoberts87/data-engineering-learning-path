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
    </div>
  );
}
