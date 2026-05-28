import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCheckpointByPhaseSlug } from "@/features/checkpoint/queries";
import { QuizForm } from "@/features/checkpoint/QuizForm";

export default async function CheckpointPage({
  params,
}: {
  params: Promise<{ phaseSlug: string }>;
}) {
  const { phaseSlug } = await params;
  const supabase = await createClient();
  const checkpoint = await getCheckpointByPhaseSlug(supabase, phaseSlug);
  if (!checkpoint) notFound();

  const lastPassed = checkpoint.latestAttempt?.passed ?? false;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={`/phase/${checkpoint.phase.slug}`}
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        ← Phase {checkpoint.phase.number}: {checkpoint.phase.title}
      </Link>

      <div className="mt-4">
        <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
          Phase {checkpoint.phase.number} checkpoint
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {checkpoint.title}
        </h1>
        {checkpoint.description && (
          <p className="mt-2 text-sm text-foreground/60">
            {checkpoint.description}
          </p>
        )}
      </div>

      {lastPassed && (
        <div className="mt-6 rounded-md border border-green-700/30 bg-green-700/10 p-4 text-sm">
          You&apos;ve already passed this checkpoint (best score{" "}
          {checkpoint.latestAttempt?.score}%). Retaking won&apos;t lose your pass.
        </div>
      )}

      <div className="mt-8">
        <QuizForm
          checkpointId={checkpoint.id}
          passScore={checkpoint.pass_score}
          questions={checkpoint.questions}
        />
      </div>
    </div>
  );
}
