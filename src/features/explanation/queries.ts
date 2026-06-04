import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ExplanationFeedback, ExplanationRecord } from "./types";

export async function getExplanationRecord(
  supabase: SupabaseClient<Database>,
  conceptId: string,
): Promise<ExplanationRecord | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("concept_explanations")
    .select("explanation, score, feedback, attempt_count, updated_at")
    .eq("user_id", user.id)
    .eq("concept_id", conceptId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    explanation: data.explanation,
    score: Number(data.score),
    feedback: data.feedback as ExplanationFeedback,
    attempt_count: data.attempt_count,
    updated_at: data.updated_at,
  };
}
