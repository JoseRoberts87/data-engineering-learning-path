"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const PASS_THRESHOLD = 3.5;

/**
 * Recompute whether a concept should be marked completed for a user.
 *
 * A concept is completed iff:
 *  - the user's latest explanation has score >= 3.5, AND
 *  - if the concept has a code challenge, the user's submission has
 *    passed_tests = true AND ai_score >= 3.5.
 *
 * Completion is sticky in the up-direction only: once a concept hits
 * "completed" we leave it there even if a later worse attempt would
 * fail to re-cross the threshold. We don't auto-downgrade.
 *
 * Returns whether the concept is now "completed" after this call.
 */
export async function recomputeConceptCompletion(
  supabase: SupabaseClient<Database>,
  userId: string,
  conceptId: string,
): Promise<{ completed: boolean }> {
  // Already completed? Stay completed.
  const { data: existingProgress } = await supabase
    .from("user_progress")
    .select("status")
    .eq("user_id", userId)
    .eq("concept_id", conceptId)
    .maybeSingle();
  if (existingProgress?.status === "completed") {
    return { completed: true };
  }

  // Explanation gate
  const { data: exp } = await supabase
    .from("concept_explanations")
    .select("score")
    .eq("user_id", userId)
    .eq("concept_id", conceptId)
    .maybeSingle();
  const explanationPassed = exp ? Number(exp.score) >= PASS_THRESHOLD : false;
  if (!explanationPassed) return { completed: false };

  // Challenge gate (only if a challenge exists for this concept)
  const { data: challenge } = await supabase
    .from("code_challenges")
    .select("id")
    .eq("concept_id", conceptId)
    .maybeSingle();

  if (challenge) {
    const { data: sub } = await supabase
      .from("user_challenge_submissions")
      .select("passed_tests, ai_score")
      .eq("user_id", userId)
      .eq("concept_id", conceptId)
      .maybeSingle();
    const challengePassed =
      sub?.passed_tests === true && Number(sub.ai_score) >= PASS_THRESHOLD;
    if (!challengePassed) return { completed: false };
  }

  // All gates pass — mark complete.
  const nowIso = new Date().toISOString();
  await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      concept_id: conceptId,
      status: "completed",
      completed_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "user_id,concept_id" },
  );
  return { completed: true };
}
