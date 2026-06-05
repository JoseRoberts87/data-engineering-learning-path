import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ConceptSection } from "./sections/types";

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
  estimated_minutes: number;
  phase: { slug: string; number: number; title: string };
  resources: Resource[];
  sections: ConceptSection[];
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
      "id, slug, title, description, swe_analogy, estimated_minutes, phases!inner(slug, number, title), resources(title, url, resource_type)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!concept) return null;

  const [{ data: progress }, { data: note }, { data: sectionsData }] =
    await Promise.all([
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
      supabase
        .from("concept_sections")
        .select("id, type, sort_order, payload")
        .eq("concept_id", concept.id)
        .order("sort_order"),
    ]);

  const sections: ConceptSection[] = (sectionsData ?? []).map((s) => ({
    id: s.id,
    type: s.type as ConceptSection["type"],
    sort_order: s.sort_order,
    payload: s.payload as never,
  })) as ConceptSection[];

  return {
    id: concept.id,
    slug: concept.slug,
    title: concept.title,
    description: concept.description,
    swe_analogy: concept.swe_analogy,
    estimated_minutes: concept.estimated_minutes,
    phase: {
      slug: concept.phases.slug,
      number: concept.phases.number,
      title: concept.phases.title,
    },
    resources: concept.resources ?? [],
    sections,
    status: (progress?.status as ConceptDetail["status"]) ?? "not_started",
    note: note?.body ?? "",
  };
}
