"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, TUTOR_MODEL } from "@/lib/anthropic";
import { recomputeConceptCompletion } from "@/features/progress/completion";
import { compareResults } from "./compare";
import type {
  ChallengeFeedback,
  SubmissionResult,
} from "./types";
import { CHALLENGE_PASS_THRESHOLD } from "./types";

const MAX_CODE_LENGTH = 4000;

export async function submitChallenge(
  challengeId: string,
  code: string,
  actualResult: Array<Record<string, unknown>>,
): Promise<SubmissionResult> {
  if (typeof code !== "string" || code.trim().length === 0) {
    return { ok: false, error: "Empty code — write a query first." };
  }
  if (code.length > MAX_CODE_LENGTH) {
    return {
      ok: false,
      error: `Code is too long (max ${MAX_CODE_LENGTH} chars).`,
    };
  }
  if (!Array.isArray(actualResult)) {
    return { ok: false, error: "Missing run result. Run the query first." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Load the challenge — needs server-side access to expected_result and
  // sample_solution, which we never expose to the client.
  const { data: challenge, error: challengeErr } = await supabase
    .from("code_challenges")
    .select(
      "id, concept_id, prompt, fixture_sql, expected_result, sample_solution, grading_notes",
    )
    .eq("id", challengeId)
    .maybeSingle();
  if (challengeErr || !challenge) {
    return { ok: false, error: "Challenge not found." };
  }

  // Functional check
  const expected = Array.isArray(challenge.expected_result)
    ? (challenge.expected_result as Array<Record<string, unknown>>)
    : [];
  const compare = compareResults(actualResult, expected);
  const passedTests = compare.match;

  // Pull concept title + phase for richer grader context.
  const { data: concept } = await supabase
    .from("concepts")
    .select("id, title, phases!inner(number, title)")
    .eq("id", challenge.concept_id)
    .maybeSingle();
  if (!concept) return { ok: false, error: "Concept not found." };

  // Previous attempt count
  const { data: existing } = await supabase
    .from("user_challenge_submissions")
    .select("attempt_count")
    .eq("user_id", user.id)
    .eq("challenge_id", challengeId)
    .maybeSingle();
  const nextAttemptCount = (existing?.attempt_count ?? 0) + 1;

  // AI grading
  let client;
  try {
    client = getAnthropicClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Grader unavailable.",
    };
  }

  let aiScore: number;
  let feedback: ChallengeFeedback;
  try {
    const systemPrompt = buildGraderSystemPrompt({
      conceptTitle: concept.title,
      phaseNumber: concept.phases.number,
      phaseTitle: concept.phases.title,
      prompt: challenge.prompt,
      fixtureSql: challenge.fixture_sql,
      expectedResult: expected,
      sampleSolution: challenge.sample_solution,
      gradingNotes: challenge.grading_notes ?? "",
      passedTests,
    });

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
          name: "submit_code_grade",
          description:
            "Record the grade and structured feedback for the learner's code submission.",
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
              summary: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              gaps: { type: "array", items: { type: "string" } },
              next_step: { type: "string" },
            },
            required: ["score", "summary", "strengths", "gaps"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_code_grade" },
      messages: [
        {
          role: "user",
          content: `The learner submitted this code. Grade their approach.

<actual_result_rows>${actualResult.length}</actual_result_rows>
<actual_result_first_row>${JSON.stringify(actualResult[0] ?? null)}</actual_result_first_row>

<code>
${code}
</code>`,
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return { ok: false, error: "Grader did not return a structured response." };
    }
    const input = toolUse.input as {
      score: number;
      summary: string;
      strengths: string[];
      gaps: string[];
      next_step?: string;
    };
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
    aiScore = Math.round(input.score * 2) / 2;
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

  // If the user didn't pass the functional check, surface that in the
  // gaps so the AI feedback isn't misleading.
  if (!passedTests && compare.reason && feedback.gaps.length < 4) {
    feedback.gaps.unshift(`Functional check: ${compare.reason}`);
  }

  const nowIso = new Date().toISOString();
  const { error: upsertErr } = await supabase
    .from("user_challenge_submissions")
    .upsert(
      {
        user_id: user.id,
        challenge_id: challengeId,
        concept_id: challenge.concept_id,
        code: code.trim(),
        passed_tests: passedTests,
        ai_score: aiScore,
        ai_feedback: feedback,
        attempt_count: nextAttemptCount,
        updated_at: nowIso,
      },
      { onConflict: "user_id,challenge_id" },
    );
  if (upsertErr) {
    return { ok: false, error: `Failed to save: ${upsertErr.message}` };
  }

  const { completed } = await recomputeConceptCompletion(
    supabase,
    user.id,
    challenge.concept_id,
  );

  revalidatePath("/concept/[slug]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/path");
  revalidatePath("/phase/[slug]", "page");

  return {
    ok: true,
    submission: {
      code: code.trim(),
      passedTests,
      aiScore,
      feedback,
      attemptCount: nextAttemptCount,
      updatedAt: nowIso,
    },
    completed,
  };
}

// ─────────────────────────────────────────────────────────────────────

type GraderCtx = {
  conceptTitle: string;
  phaseNumber: number;
  phaseTitle: string;
  prompt: string;
  fixtureSql: string;
  expectedResult: Array<Record<string, unknown>>;
  sampleSolution: string;
  gradingNotes: string;
  passedTests: boolean;
};

function buildGraderSystemPrompt(ctx: GraderCtx): string {
  return `You are an expert data engineering tutor grading a code challenge.

# CONCEPT
Phase ${ctx.phaseNumber}: ${ctx.phaseTitle}
Concept: ${ctx.conceptTitle}

# THE CHALLENGE
${ctx.prompt}

# FIXTURE (the data the learner is working against)
\`\`\`sql
${ctx.fixtureSql}
\`\`\`

# EXPECTED RESULT (server-side; the learner's code must produce these rows)
${JSON.stringify(ctx.expectedResult, null, 2)}

# SAMPLE SOLUTION (for grading reference only)
\`\`\`sql
${ctx.sampleSolution}
\`\`\`

${ctx.gradingNotes ? `# GRADING NOTES\n${ctx.gradingNotes}\n\n` : ""}# FUNCTIONAL CHECK RESULT
The functional test ${ctx.passedTests ? "PASSED" : "FAILED"}. The actual rows produced by their query ${ctx.passedTests ? "match" : "do not match"} the expected output.

# GRADING RUBRIC (0 to 5 in 0.5 increments)

You are grading **approach and conceptual fit**, not functional correctness (which is already determined). The threshold to pass this gate is **3.5**.

- **0.0 - 1.9** — Code is fundamentally wrong, off-task, or shows no understanding of the concept being taught. Reserve for cases like the code being unrelated, or where the approach can't possibly work even with fixes.
- **2.0 - 2.9** — Partial. Some correct elements but misses the core pattern the concept is about (e.g., uses INSERT when the concept is idempotency and MERGE is needed; computes a window but uses processing time when event time is the point).
- **3.0 - 3.4** — Reasonable approach but shallow. Hits the surface; would need help in production (missing edge cases, no nulls handling, etc.).
- **3.5 - 4.4** — Solid. The right pattern for the concept. Internally consistent. Pass threshold. Production-ready for the simple case.
- **4.5 - 5.0** — Strong. Right pattern + handles edge cases + clear and idiomatic. Reserve 5.0 for excellent solutions only.

# GRADING GUIDELINES

- A passing functional check is necessary but not sufficient. A query can produce the right output for the wrong reasons (hardcoded values, lucky CASE WHEN, ignoring the actual mechanism). Read the *code*, not just the *result*.
- A failing functional check should usually be at most 3.0 unless the code is structurally on the right path and the failure is a minor bug.
- Reward learner-style idioms (CTEs, named columns, sensible aliases) but don't punish concise correct code.
- For "strengths" and "gaps": be specific. Cite identifiers or constructs from the code.
- For "next_step": one concrete pointer — either an edge case to handle, or a related concept worth applying.

You must respond by calling the submit_code_grade tool. Do not include any text before or after.`;
}
