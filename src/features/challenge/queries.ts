import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  ChallengeContent,
  ChallengeFeedback,
  ChallengeSubmission,
} from "./types";

export async function getChallengeForConcept(
  supabase: SupabaseClient<Database>,
  conceptId: string,
): Promise<ChallengeContent | null> {
  const { data, error } = await supabase
    .from("code_challenges")
    .select("id, concept_id, prompt, starter_sql, fixture_sql, hints")
    .eq("concept_id", conceptId)
    .maybeSingle();
  if (error || !data) return null;
  const hintsArray = Array.isArray(data.hints) ? (data.hints as string[]) : [];
  return {
    id: data.id,
    conceptId: data.concept_id,
    prompt: data.prompt,
    starterSql: data.starter_sql,
    fixtureSql: data.fixture_sql,
    hints: hintsArray.filter((h): h is string => typeof h === "string"),
  };
}

export async function getChallengeSubmission(
  supabase: SupabaseClient<Database>,
  conceptId: string,
): Promise<ChallengeSubmission | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_challenge_submissions")
    .select("code, passed_tests, ai_score, ai_feedback, attempt_count, updated_at")
    .eq("user_id", user.id)
    .eq("concept_id", conceptId)
    .maybeSingle();
  if (error || !data) return null;

  return {
    code: data.code,
    passedTests: data.passed_tests,
    aiScore: Number(data.ai_score),
    feedback: data.ai_feedback as ChallengeFeedback,
    attemptCount: data.attempt_count,
    updatedAt: data.updated_at,
  };
}
