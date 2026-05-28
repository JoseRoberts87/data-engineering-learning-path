import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export type PhaseConcept = {
  id: string;
  slug: string;
  title: string;
  description: string;
  swe_analogy: string;
  sort_order: number;
  status: ProgressStatus;
};

export type PhaseDetail = {
  id: string;
  slug: string;
  number: number;
  title: string;
  tagline: string | null;
  concepts: PhaseConcept[];
};

export async function getPhaseWithConcepts(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<PhaseDetail | null> {
  const { data: phase, error } = await supabase
    .from("phases")
    .select(
      "id, slug, number, title, tagline, concepts(id, slug, title, description, swe_analogy, sort_order)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!phase) return null;

  const conceptIds = phase.concepts.map((c) => c.id);
  const { data: progress } = await supabase
    .from("user_progress")
    .select("concept_id, status")
    .in("concept_id", conceptIds.length ? conceptIds : [""]);
  const statusByConcept = new Map(
    (progress ?? []).map((p) => [p.concept_id, p.status as ProgressStatus]),
  );

  const concepts: PhaseConcept[] = phase.concepts
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      swe_analogy: c.swe_analogy,
      sort_order: c.sort_order,
      status: statusByConcept.get(c.id) ?? "not_started",
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: phase.id,
    slug: phase.slug,
    number: phase.number,
    title: phase.title,
    tagline: phase.tagline,
    concepts,
  };
}
