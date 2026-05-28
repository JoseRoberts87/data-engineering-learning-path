"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export async function setConceptProgress(
  conceptId: string,
  status: ProgressStatus,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      concept_id: conceptId,
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,concept_id" },
  );
  if (error) throw error;

  revalidatePath("/path");
  revalidatePath("/phase/[slug]", "page");
  revalidatePath("/concept/[slug]", "page");
}
