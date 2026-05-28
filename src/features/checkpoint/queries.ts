import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type QuizOption = { id: string; text: string; correct: boolean };

export type CheckpointQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  explanation: string | null;
  sort_order: number;
};

export type LatestAttempt = {
  id: string;
  score: number;
  passed: boolean;
  attempted_at: string;
  answers: Record<string, string>;
};

export type CheckpointDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  pass_score: number;
  phase: { slug: string; number: number; title: string };
  questions: CheckpointQuestion[];
  latestAttempt: LatestAttempt | null;
};

export async function getCheckpointByPhaseSlug(
  supabase: SupabaseClient<Database>,
  phaseSlug: string,
): Promise<CheckpointDetail | null> {
  const { data: checkpoint, error } = await supabase
    .from("checkpoints")
    .select(
      "id, slug, title, description, pass_score, phases!inner(slug, number, title), checkpoint_questions(id, prompt, options, explanation, sort_order)",
    )
    .eq("phases.slug", phaseSlug)
    .maybeSingle();
  if (error) throw error;
  if (!checkpoint) return null;

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, score, passed, attempted_at, answers")
    .eq("checkpoint_id", checkpoint.id)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const questions: CheckpointQuestion[] = (checkpoint.checkpoint_questions ?? [])
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options as unknown as QuizOption[],
      explanation: q.explanation,
      sort_order: q.sort_order,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: checkpoint.id,
    slug: checkpoint.slug,
    title: checkpoint.title,
    description: checkpoint.description,
    pass_score: checkpoint.pass_score,
    phase: {
      slug: checkpoint.phases.slug,
      number: checkpoint.phases.number,
      title: checkpoint.phases.title,
    },
    questions,
    latestAttempt: attempt
      ? {
          id: attempt.id,
          score: attempt.score,
          passed: attempt.passed,
          attempted_at: attempt.attempted_at,
          answers: attempt.answers as Record<string, string>,
        }
      : null,
  };
}

export type PhaseCheckpointSummary = {
  slug: string;
  passed: boolean;
  bestScore: number | null;
};

export async function getCheckpointSummaryForPhase(
  supabase: SupabaseClient<Database>,
  phaseId: string,
): Promise<PhaseCheckpointSummary | null> {
  const { data: checkpoint } = await supabase
    .from("checkpoints")
    .select("id, slug")
    .eq("phase_id", phaseId)
    .maybeSingle();
  if (!checkpoint) return null;

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("score, passed")
    .eq("checkpoint_id", checkpoint.id);

  const passed = (attempts ?? []).some((a) => a.passed);
  const bestScore = (attempts ?? []).reduce<number | null>(
    (best, a) => (best === null || a.score > best ? a.score : best),
    null,
  );

  return { slug: checkpoint.slug, passed, bestScore };
}
