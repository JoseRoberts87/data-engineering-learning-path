import { createClient } from "@supabase/supabase-js";
import { phases, concepts } from "./content";
import { checkpoints, questions } from "./checkpoints";
import { capstoneSteps } from "./capstone";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Check .env.local."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function upsertPhases(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("phases")
    .upsert(phases, { onConflict: "slug" })
    .select("id, slug");
  if (error) throw error;
  console.log(`  phases:   ${data.length} upserted`);
  return new Map(data.map((p) => [p.slug, p.id]));
}

async function upsertConcepts(phaseIds: Map<string, string>) {
  const rows = concepts.map((c) => {
    const phase_id = phaseIds.get(c.phase_slug);
    if (!phase_id) throw new Error(`Unknown phase_slug: ${c.phase_slug}`);
    return {
      slug: c.slug,
      phase_id,
      title: c.title,
      description: c.description,
      swe_analogy: c.swe_analogy,
      sort_order: c.sort_order,
    };
  });
  const { data, error } = await supabase
    .from("concepts")
    .upsert(rows, { onConflict: "slug" })
    .select("id");
  if (error) throw error;
  console.log(`  concepts: ${data.length} upserted`);
}

async function upsertCheckpoints(
  phaseIds: Map<string, string>
): Promise<Map<string, string>> {
  const rows = checkpoints.map((c) => {
    const phase_id = phaseIds.get(c.phase_slug);
    if (!phase_id) throw new Error(`Unknown phase_slug: ${c.phase_slug}`);
    return {
      slug: c.slug,
      phase_id,
      title: c.title,
      description: c.description,
      pass_score: c.pass_score,
      sort_order: c.sort_order,
    };
  });
  const { data, error } = await supabase
    .from("checkpoints")
    .upsert(rows, { onConflict: "slug" })
    .select("id, slug");
  if (error) throw error;
  console.log(`  checkpoints: ${data.length} upserted`);
  return new Map(data.map((c) => [c.slug, c.id]));
}

async function replaceQuestions(checkpointIds: Map<string, string>) {
  const ids = Array.from(checkpointIds.values());
  const { error: delErr } = await supabase
    .from("checkpoint_questions")
    .delete()
    .in("checkpoint_id", ids);
  if (delErr) throw delErr;

  const rows = questions.map((q) => {
    const checkpoint_id = checkpointIds.get(q.checkpoint_slug);
    if (!checkpoint_id)
      throw new Error(`Unknown checkpoint_slug: ${q.checkpoint_slug}`);
    return {
      checkpoint_id,
      prompt: q.prompt,
      options: q.options,
      explanation: q.explanation,
      sort_order: q.sort_order,
    };
  });
  const { data, error } = await supabase
    .from("checkpoint_questions")
    .insert(rows)
    .select("id");
  if (error) throw error;
  console.log(`  questions: ${data.length} inserted (after delete-all)`);
}

async function upsertCapstoneSteps(phaseIds: Map<string, string>) {
  const rows = capstoneSteps.map((s) => ({
    slug: s.slug,
    phase_id: s.phase_slug ? phaseIds.get(s.phase_slug) ?? null : null,
    title: s.title,
    description: s.description,
    hints: s.hints,
    sort_order: s.sort_order,
  }));
  const { data, error } = await supabase
    .from("capstone_steps")
    .upsert(rows, { onConflict: "slug" })
    .select("id");
  if (error) throw error;
  console.log(`  capstone_steps: ${data.length} upserted`);
}

async function main() {
  console.log("Seeding content...");
  const phaseIds = await upsertPhases();
  await upsertConcepts(phaseIds);
  const checkpointIds = await upsertCheckpoints(phaseIds);
  await replaceQuestions(checkpointIds);
  await upsertCapstoneSteps(phaseIds);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
