import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type PhaseWithProgress = {
  id: string;
  slug: string;
  number: number;
  title: string;
  tagline: string | null;
  total: number;
  completed: number;
  estimatedMinutes: number;
};

export async function getPhasesWithProgress(
  supabase: SupabaseClient<Database>,
): Promise<PhaseWithProgress[]> {
  const { data: phases, error } = await supabase
    .from("phases")
    .select(
      "id, slug, number, title, tagline, concepts(id, estimated_minutes)",
    )
    .order("sort_order");
  if (error) throw error;

  const { data: progress } = await supabase
    .from("user_progress")
    .select("concept_id, status")
    .eq("status", "completed");
  const completed = new Set((progress ?? []).map((p) => p.concept_id));

  return (phases ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    number: p.number,
    title: p.title,
    tagline: p.tagline,
    total: p.concepts.length,
    completed: p.concepts.filter((c) => completed.has(c.id)).length,
    estimatedMinutes: p.concepts.reduce(
      (sum, c) => sum + (c.estimated_minutes ?? 0),
      0,
    ),
  }));
}
