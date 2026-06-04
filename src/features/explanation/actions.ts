"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, TUTOR_MODEL } from "@/lib/anthropic";
import { connections } from "@/features/connections/data";
import { recomputeConceptCompletion } from "@/features/progress/completion";
import type {
  EvaluationResult,
  ExplanationFeedback,
} from "./types";
import { COMPLETION_THRESHOLD } from "./types";

const MAX_EXPLANATION_LENGTH = 4000;
const MIN_EXPLANATION_LENGTH = 30;

export async function submitExplanation(
  conceptId: string,
  explanation: string,
): Promise<EvaluationResult> {
  const trimmed = explanation.trim();
  if (trimmed.length < MIN_EXPLANATION_LENGTH) {
    return {
      ok: false,
      error: `Please write at least ${MIN_EXPLANATION_LENGTH} characters before submitting.`,
    };
  }
  if (trimmed.length > MAX_EXPLANATION_LENGTH) {
    return {
      ok: false,
      error: `Please keep your explanation under ${MAX_EXPLANATION_LENGTH} characters.`,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Load full concept context for the grader.
  const { data: concept, error: conceptErr } = await supabase
    .from("concepts")
    .select(
      "id, slug, title, description, swe_analogy, phases!inner(number, title, tagline)",
    )
    .eq("id", conceptId)
    .maybeSingle();
  if (conceptErr || !concept) {
    return { ok: false, error: "Concept not found." };
  }

  const { data: sections } = await supabase
    .from("concept_sections")
    .select("type, sort_order, payload")
    .eq("concept_id", concept.id)
    .order("sort_order");

  // Previous attempt count (so we increment correctly).
  const { data: existing } = await supabase
    .from("concept_explanations")
    .select("attempt_count")
    .eq("user_id", user.id)
    .eq("concept_id", concept.id)
    .maybeSingle();
  const nextAttemptCount = (existing?.attempt_count ?? 0) + 1;

  // Build the grading prompt.
  const systemPrompt = buildGraderSystemPrompt({
    title: concept.title,
    phaseNumber: concept.phases.number,
    phaseTitle: concept.phases.title,
    phaseTagline: concept.phases.tagline,
    description: concept.description,
    sweAnalogy: concept.swe_analogy,
    sections: (sections ?? []).map((s) => ({
      type: s.type as string,
      payload: s.payload,
    })),
    relatedConnectionLabels: connections
      .filter((c) => c.from === concept.slug || c.to === concept.slug)
      .map((c) => c.label),
  });

  // Call Claude with forced tool use for structured output.
  let client;
  try {
    client = getAnthropicClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Grader unavailable.",
    };
  }

  let score: number;
  let feedback: ExplanationFeedback;
  try {
    const response = await client.messages.create({
      model: TUTOR_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        {
          name: "submit_grade",
          description:
            "Record the grade and structured feedback for the learner's explanation.",
          input_schema: {
            type: "object",
            properties: {
              score: {
                type: "number",
                description:
                  "Grade from 0 to 5, in 0.5 increments. Use the rubric in the system prompt.",
                minimum: 0,
                maximum: 5,
                multipleOf: 0.5,
              },
              summary: {
                type: "string",
                description:
                  "One sentence summarizing how well the explanation captures the concept.",
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description:
                  "1-4 specific things the learner got right. Empty array if none.",
              },
              gaps: {
                type: "array",
                items: { type: "string" },
                description:
                  "0-4 specific things missing, wrong, or weakly stated. Empty array if explanation is excellent.",
              },
              next_step: {
                type: "string",
                description:
                  "Optional. One concrete sentence pointing the learner to the next thing to read or think about.",
              },
            },
            required: ["score", "summary", "strengths", "gaps"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_grade" },
      messages: [
        {
          role: "user",
          content: `Here is the learner's explanation. Grade it using the rubric.\n\n<explanation>\n${trimmed}\n</explanation>`,
        },
      ],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return {
        ok: false,
        error: "Grader did not return a structured response.",
      };
    }
    const input = toolUse.input as {
      score: number;
      summary: string;
      strengths: string[];
      gaps: string[];
      next_step?: string;
    };

    // Defensive validation — the tool schema should enforce this but trust nothing.
    if (
      typeof input.score !== "number" ||
      input.score < 0 ||
      input.score > 5 ||
      typeof input.summary !== "string" ||
      !Array.isArray(input.strengths) ||
      !Array.isArray(input.gaps)
    ) {
      return { ok: false, error: "Grader returned an invalid response shape." };
    }

    // Snap to 0.5 increments defensively.
    score = Math.round(input.score * 2) / 2;
    feedback = {
      summary: input.summary,
      strengths: input.strengths.slice(0, 4),
      gaps: input.gaps.slice(0, 4),
      next_step: input.next_step,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Grader request failed.",
    };
  }

  // Upsert the explanation row.
  const nowIso = new Date().toISOString();
  const { error: upsertErr } = await supabase
    .from("concept_explanations")
    .upsert(
      {
        user_id: user.id,
        concept_id: concept.id,
        explanation: trimmed,
        score,
        feedback,
        attempt_count: nextAttemptCount,
        updated_at: nowIso,
      },
      { onConflict: "user_id,concept_id" },
    );
  if (upsertErr) {
    return { ok: false, error: `Failed to save: ${upsertErr.message}` };
  }

  // Delegate completion logic to the shared helper — which knows about
  // both gates (explanation + optional code challenge).
  const { completed } = await recomputeConceptCompletion(
    supabase,
    user.id,
    concept.id,
  );

  revalidatePath("/concept/[slug]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/path");
  revalidatePath("/phase/[slug]", "page");

  return {
    ok: true,
    record: {
      explanation: trimmed,
      score,
      feedback,
      attempt_count: nextAttemptCount,
      updated_at: nowIso,
    },
    completed,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Grader prompt construction
// ─────────────────────────────────────────────────────────────────────

type GraderContext = {
  title: string;
  phaseNumber: number;
  phaseTitle: string;
  phaseTagline: string | null;
  description: string;
  sweAnalogy: string;
  sections: { type: string; payload: unknown }[];
  relatedConnectionLabels: string[];
};

function buildGraderSystemPrompt(ctx: GraderContext): string {
  // Best-effort flatten of section payloads to surface key content.
  const sectionSummary = ctx.sections
    .map((s, i) => `${i + 1}. (${s.type}) ${flattenSectionPayload(s.payload)}`)
    .join("\n");

  const connectionSummary = ctx.relatedConnectionLabels.length
    ? ctx.relatedConnectionLabels
        .slice(0, 12)
        .map((l, i) => `${i + 1}. ${l}`)
        .join("\n")
    : "(none)";

  return `You are an expert data engineering tutor who has mastered all seven phases of this curriculum. Your job is to grade a learner's own-words explanation of one specific concept.

# THE CONCEPT BEING EXPLAINED

Phase ${ctx.phaseNumber}: ${ctx.phaseTitle}${ctx.phaseTagline ? ` — ${ctx.phaseTagline}` : ""}

Concept: ${ctx.title}

## Curriculum description (what the learner read)
${ctx.description}

## SWE analogy (the bridge to software engineering)
${ctx.sweAnalogy}

## Key takeaways from the interactive sections
${sectionSummary || "(no sections)"}

## How this concept connects to others in the curriculum
${connectionSummary}

# GRADING RUBRIC (0 to 5 in 0.5 increments)

Grade strictly on **understanding**, not prose quality, length, or correctness of incidental details.

- **0.0 - 0.9** — Doesn't demonstrate understanding. Off-topic, blank, or fundamentally wrong about the core idea.
- **1.0 - 1.9** — Some terminology repeated, but mechanisms misunderstood. Could be summarizing the page from memory without grasping why.
- **2.0 - 2.9** — Partial grasp. Captures some pieces but misses key ideas or makes one substantive error.
- **3.0 - 3.4** — Adequate. Hits the core idea but is shallow on the *why* or omits an important nuance.
- **3.5 - 4.4** — Solid grasp. Explains the why, not just the what. Uses an apt analogy (their own or the curriculum's). Internally consistent. Threshold to pass.
- **4.5 - 5.0** — Strong grasp. Correct, complete, and shows the learner can apply the idea — e.g., they describe a failure mode, draw a connection to another concept, or articulate the trade-off the concept resolves. Reserve 5.0 for genuinely excellent explanations.

# GRADING GUIDELINES

- Award credit for the learner's own analogies and framings, even if they differ from the curriculum's. Multiple framings of a correct idea are fine; only mark down for misunderstanding the mechanism.
- Don't punish brevity. A concise correct explanation can score 4.5+.
- Don't punish missing terminology. If they explain the idea in plain language, that's fine — grade understanding, not vocabulary.
- Do punish "talking around" the concept (recapping what was in the description without showing they got the *why*).
- The threshold to mark this concept complete is **3.5**. Be honest: a learner who reads "3.0 - needs more depth" and iterates learns more than one who skates by.
- For "strengths" and "gaps": be specific. Not "good understanding" but "correctly identifies that idempotency is what makes safe retries possible." Not "could be deeper" but "doesn't address why this is harder for stateful operators than stateless ones."
- For "next_step" (optional): one concrete pointer. Either a specific aspect to deepen, or a related concept from the connections list to read next.

You must respond by calling the submit_grade tool. Do not include any text before or after.`;
}

// Best-effort flatten of a section payload into a short, prompt-safe summary.
// Sections are jsonb with type-specific shapes; we pull the most salient
// text fields without depending on exhaustive schema knowledge.
function flattenSectionPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof p.title === "string") parts.push(p.title);
  if (typeof p.intro === "string") parts.push(p.intro);
  if (typeof p.prompt === "string") parts.push(`Q: ${p.prompt}`);

  if (Array.isArray(p.items)) {
    const itemBits = p.items
      .slice(0, 4)
      .map((it) => {
        if (typeof it !== "object" || it === null) return "";
        const o = it as Record<string, unknown>;
        return [o.name, o.scenario, o.description]
          .filter((v) => typeof v === "string")
          .join(" — ");
      })
      .filter(Boolean);
    if (itemBits.length) parts.push(itemBits.join("; "));
  }

  if (Array.isArray(p.pairs)) {
    const pairBits = p.pairs
      .slice(0, 3)
      .map((pair) => {
        if (typeof pair !== "object" || pair === null) return "";
        const o = pair as Record<string, unknown>;
        return `${o.left} ↔ ${o.right}`;
      })
      .filter(Boolean);
    if (pairBits.length) parts.push(pairBits.join("; "));
  }

  return parts.join(". ").slice(0, 400);
}
