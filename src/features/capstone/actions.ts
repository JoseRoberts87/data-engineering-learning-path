"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProgressStatus } from "@/features/progress/actions";

async function authedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function setCapstoneStepStatus(
  stepId: string,
  status: ProgressStatus,
) {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase.from("user_capstone_progress").upsert(
    {
      user_id: userId,
      step_id: stepId,
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,step_id" },
  );
  if (error) throw error;
  revalidatePath("/capstone");
}

export async function setCapstoneStepNotes(stepId: string, notes: string) {
  const { supabase, userId } = await authedClient();
  const { error } = await supabase.from("user_capstone_progress").upsert(
    {
      user_id: userId,
      step_id: stepId,
      notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,step_id" },
  );
  if (error) throw error;
}
