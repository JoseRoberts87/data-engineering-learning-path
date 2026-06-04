import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type GraphConcept = {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
  phase_number: number;
  phase_slug: string;
  phase_title: string;
};

export async function getGraphConcepts(
  supabase: SupabaseClient<Database>,
): Promise<GraphConcept[]> {
  const { data, error } = await supabase
    .from("phases")
    .select("slug, number, title, concepts(id, slug, title, sort_order)")
    .order("number");

  if (error) throw error;

  const concepts: GraphConcept[] = [];
  for (const phase of data ?? []) {
    for (const concept of phase.concepts ?? []) {
      concepts.push({
        id: concept.id,
        slug: concept.slug,
        title: concept.title,
        sort_order: concept.sort_order,
        phase_number: phase.number,
        phase_slug: phase.slug,
        phase_title: phase.title,
      });
    }
  }
  return concepts;
}
