import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type Resource = {
  title: string;
  url: string;
  resource_type: string;
};

export type ConceptDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  swe_analogy: string;
  phase: { slug: string; number: number; title: string };
  resources: Resource[];
  status: "not_started" | "in_progress" | "completed";
  note: string;
};

export async function getConceptWithContext(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<ConceptDetail | null> {
  const { data: concept, error } = await supabase
    .from("concepts")
    .select(
      "id, slug, title, description, swe_analogy, phases!inner(slug, number, title), resources(title, url, resource_type)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!concept) return null;

  const [{ data: progress }, { data: note }] = await Promise.all([
    supabase
      .from("user_progress")
      .select("status")
      .eq("concept_id", concept.id)
      .maybeSingle(),
    supabase
      .from("user_notes")
      .select("body")
      .eq("concept_id", concept.id)
      .maybeSingle(),
  ]);

  return {
    id: concept.id,
    slug: concept.slug,
    title: concept.title,
    description: concept.description,
    swe_analogy: concept.swe_analogy,
    phase: {
      slug: concept.phases.slug,
      number: concept.phases.number,
      title: concept.phases.title,
    },
    resources: concept.resources ?? [],
    status: (progress?.status as ConceptDetail["status"]) ?? "not_started",
    note: note?.body ?? "",
  };
}
