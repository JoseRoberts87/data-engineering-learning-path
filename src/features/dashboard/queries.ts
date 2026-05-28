import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type DashboardPhase = {
  id: string;
  slug: string;
  number: number;
  title: string;
  total: number;
  completed: number;
  checkpointPassed: boolean;
  checkpointSlug: string | null;
  bestCheckpointScore: number | null;
};

export type DashboardData = {
  overall: { total: number; completed: number };
  phases: DashboardPhase[];
  capstone: {
    total: number;
    completed: number;
    nextStepTitle: string | null;
  };
  nextIncomplete: {
    phaseNumber: number;
    phaseTitle: string;
    conceptSlug: string;
    conceptTitle: string;
  } | null;
};

export async function getDashboardData(
  supabase: SupabaseClient<Database>,
): Promise<DashboardData> {
  const [phasesRes, progressRes, checkpointsRes, attemptsRes, stepsRes, stepProgressRes] =
    await Promise.all([
      supabase
        .from("phases")
        .select("id, slug, number, title, concepts(id, slug, title, sort_order)")
        .order("sort_order"),
      supabase.from("user_progress").select("concept_id, status"),
      supabase.from("checkpoints").select("id, phase_id, slug"),
      supabase.from("quiz_attempts").select("checkpoint_id, score, passed"),
      supabase
        .from("capstone_steps")
        .select("id, slug, title, sort_order")
        .order("sort_order"),
      supabase.from("user_capstone_progress").select("step_id, status"),
    ]);

  if (phasesRes.error) throw phasesRes.error;
  if (checkpointsRes.error) throw checkpointsRes.error;
  if (stepsRes.error) throw stepsRes.error;

  const completedConcepts = new Set(
    (progressRes.data ?? [])
      .filter((p) => p.status === "completed")
      .map((p) => p.concept_id),
  );

  const passedCheckpoints = new Set(
    (attemptsRes.data ?? []).filter((a) => a.passed).map((a) => a.checkpoint_id),
  );

  const bestScoreByCheckpoint = new Map<string, number>();
  for (const a of attemptsRes.data ?? []) {
    const current = bestScoreByCheckpoint.get(a.checkpoint_id) ?? -1;
    if (a.score > current) bestScoreByCheckpoint.set(a.checkpoint_id, a.score);
  }

  const completedSteps = new Set(
    (stepProgressRes.data ?? [])
      .filter((p) => p.status === "completed")
      .map((p) => p.step_id),
  );

  const phases: DashboardPhase[] = (phasesRes.data ?? []).map((p) => {
    const checkpoint = (checkpointsRes.data ?? []).find(
      (c) => c.phase_id === p.id,
    );
    const total = p.concepts.length;
    const completed = p.concepts.filter((c) => completedConcepts.has(c.id)).length;
    return {
      id: p.id,
      slug: p.slug,
      number: p.number,
      title: p.title,
      total,
      completed,
      checkpointPassed: checkpoint
        ? passedCheckpoints.has(checkpoint.id)
        : false,
      checkpointSlug: checkpoint?.slug ?? null,
      bestCheckpointScore: checkpoint
        ? bestScoreByCheckpoint.get(checkpoint.id) ?? null
        : null,
    };
  });

  const totalConcepts = phases.reduce((s, p) => s + p.total, 0);
  const totalCompleted = phases.reduce((s, p) => s + p.completed, 0);

  let nextIncomplete: DashboardData["nextIncomplete"] = null;
  for (const p of phasesRes.data ?? []) {
    const sorted = [...p.concepts].sort((a, b) => a.sort_order - b.sort_order);
    const next = sorted.find((c) => !completedConcepts.has(c.id));
    if (next) {
      nextIncomplete = {
        phaseNumber: p.number,
        phaseTitle: p.title,
        conceptSlug: next.slug,
        conceptTitle: next.title,
      };
      break;
    }
  }

  const steps = stepsRes.data ?? [];
  const capstoneCompleted = steps.filter((s) => completedSteps.has(s.id)).length;
  const nextStep = steps.find((s) => !completedSteps.has(s.id));

  return {
    overall: { total: totalConcepts, completed: totalCompleted },
    phases,
    capstone: {
      total: steps.length,
      completed: capstoneCompleted,
      nextStepTitle: nextStep?.title ?? null,
    },
    nextIncomplete,
  };
}
