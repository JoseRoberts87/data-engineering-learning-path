"use server";

import { createClient } from "@/lib/supabase/server";

export async function setConceptNote(conceptId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("user_notes").upsert(
    {
      user_id: user.id,
      concept_id: conceptId,
      body,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,concept_id" },
  );
  if (error) throw error;
}
