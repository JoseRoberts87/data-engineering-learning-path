"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SubmitInput = {
  checkpointId: string;
  answers: Record<string, string>;
  score: number;
  passed: boolean;
};

export async function submitQuizAttempt(input: SubmitInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    checkpoint_id: input.checkpointId,
    answers: input.answers,
    score: input.score,
    passed: input.passed,
  });
  if (error) throw error;

  revalidatePath("/path");
  revalidatePath("/phase/[slug]", "page");
  revalidatePath("/checkpoint/[phaseSlug]", "page");
}
