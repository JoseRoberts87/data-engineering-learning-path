import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function getPriorTutorMessages(
  supabase: SupabaseClient<Database>,
  conceptId: string,
): Promise<TutorMessage[]> {
  const { data, error } = await supabase
    .from("tutor_messages")
    .select("id, role, content, created_at")
    .eq("concept_id", conceptId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    created_at: m.created_at,
  }));
}
