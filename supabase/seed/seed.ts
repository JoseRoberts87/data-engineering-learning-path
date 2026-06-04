import { createClient } from "@supabase/supabase-js";
import { phases, concepts } from "./content";
import { checkpoints, questions } from "./checkpoints";
import { capstoneSteps } from "./capstone";
import { resources } from "./resources";
import { sections } from "./sections";
import { challenges } from "./challenges";

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

async function upsertConcepts(
  phaseIds: Map<string, string>,
): Promise<Map<string, string>> {
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
    .select("id, slug");
  if (error) throw error;
  console.log(`  concepts: ${data.length} upserted`);
  return new Map(data.map((c) => [c.slug, c.id]));
}

async function replaceSections(conceptIds: Map<string, string>) {
  const { error: delErr } = await supabase
    .from("concept_sections")
    .delete()
    .gte("created_at", "1970-01-01");
  if (delErr) throw delErr;

  const rows = sections.map((s) => {
    const concept_id = conceptIds.get(s.concept_slug);
    if (!concept_id)
      throw new Error(`Unknown concept_slug for section: ${s.concept_slug}`);
    return {
      concept_id,
      type: s.type,
      sort_order: s.sort_order,
      payload: s.payload,
    };
  });
  if (rows.length === 0) {
    console.log("  sections: 0 inserted");
    return;
  }
  const { data, error } = await supabase
    .from("concept_sections")
    .insert(rows)
    .select("id");
  if (error) throw error;
  console.log(`  sections: ${data.length} inserted (after delete-all)`);
}

async function replaceResources(conceptIds: Map<string, string>) {
  // The resources table has no natural unique key, so we wipe and reinsert.
  // Sentinel filter required by supabase-js v2 — delete() with no filter is rejected.
  const { error: delErr } = await supabase
    .from("resources")
    .delete()
    .gte("created_at", "1970-01-01");
  if (delErr) throw delErr;

  const rows = resources.map((r) => {
    const concept_id = conceptIds.get(r.concept_slug);
    if (!concept_id)
      throw new Error(`Unknown concept_slug for resource: ${r.concept_slug}`);
    return {
      concept_id,
      title: r.title,
      url: r.url,
      resource_type: r.resource_type,
    };
  });
  if (rows.length === 0) {
    console.log("  resources: 0 inserted");
    return;
  }
  const { data, error } = await supabase.from("resources").insert(rows).select("id");
  if (error) throw error;
  console.log(`  resources: ${data.length} inserted (after delete-all)`);
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

async function replaceChallenges(conceptIds: Map<string, string>) {
  // Wipe + reinsert. user_challenge_submissions will cascade if challenges
  // are dropped via the FK, but we expect to only edit content here, not
  // remove challenges users have submitted against in production. If you
  // change a challenge after users have submitted, their submissions stay
  // (concept_id is also denormalized on submissions for this reason).
  const { error: delErr } = await supabase
    .from("code_challenges")
    .delete()
    .gte("created_at", "1970-01-01");
  if (delErr) throw delErr;

  const rows = challenges.map((c) => {
    const concept_id = conceptIds.get(c.concept_slug);
    if (!concept_id)
      throw new Error(`Unknown concept_slug for challenge: ${c.concept_slug}`);
    return {
      concept_id,
      prompt: c.prompt,
      starter_sql: c.starter_sql,
      fixture_sql: c.fixture_sql,
      expected_result: c.expected_result,
      sample_solution: c.sample_solution,
      grading_notes: c.grading_notes,
      hints: c.hints,
    };
  });
  if (rows.length === 0) {
    console.log("  challenges: 0 inserted");
    return;
  }
  const { data, error } = await supabase
    .from("code_challenges")
    .insert(rows)
    .select("id");
  if (error) throw error;
  console.log(`  challenges: ${data.length} inserted (after delete-all)`);
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
  const conceptIds = await upsertConcepts(phaseIds);
  const checkpointIds = await upsertCheckpoints(phaseIds);
  await replaceQuestions(checkpointIds);
  await replaceResources(conceptIds);
  await replaceSections(conceptIds);
  await replaceChallenges(conceptIds);
  await upsertCapstoneSteps(phaseIds);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
