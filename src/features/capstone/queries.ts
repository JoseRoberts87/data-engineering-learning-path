import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ProgressStatus } from "@/features/progress/actions";

export type CapstoneStep = {
  id: string;
  slug: string;
  title: string;
  description: string;
  hints: string | null;
  sort_order: number;
  phase: { slug: string; number: number; title: string } | null;
  status: ProgressStatus;
  notes: string;
};

export async function getCapstoneSteps(
  supabase: SupabaseClient<Database>,
): Promise<CapstoneStep[]> {
  const { data: steps, error } = await supabase
    .from("capstone_steps")
    .select(
      "id, slug, title, description, hints, sort_order, phases(slug, number, title)",
    )
    .order("sort_order");
  if (error) throw error;

  const { data: progress } = await supabase
    .from("user_capstone_progress")
    .select("step_id, status, notes");

  const byStep = new Map(
    (progress ?? []).map((p) => [
      p.step_id,
      { status: p.status as ProgressStatus, notes: p.notes ?? "" },
    ]),
  );

  return (steps ?? []).map((s) => {
    const own = byStep.get(s.id);
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      hints: s.hints,
      sort_order: s.sort_order,
      phase: s.phases
        ? {
            slug: s.phases.slug,
            number: s.phases.number,
            title: s.phases.title,
          }
        : null,
      status: own?.status ?? "not_started",
      notes: own?.notes ?? "",
    };
  });
}
