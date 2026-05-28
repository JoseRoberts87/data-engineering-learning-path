import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, TUTOR_MODEL } from "@/lib/anthropic";
import type { Database } from "@/types/database";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ConceptContext = {
  id: string;
  title: string;
  description: string;
  swe_analogy: string;
  phase: { number: number; title: string; tagline: string | null };
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let body: { conceptSlug?: string; messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }
  const { conceptSlug, messages } = body;
  if (!conceptSlug || !Array.isArray(messages) || messages.length === 0) {
    return errorResponse("conceptSlug and messages are required", 400);
  }
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) {
    return errorResponse("Need at least one user message", 400);
  }

  const concept = await loadConcept(supabase, conceptSlug);
  if (!concept) {
    return errorResponse("Concept not found", 404);
  }

  // Persist the user's latest message before streaming — if the stream fails,
  // we still have the question.
  await supabase.from("tutor_messages").insert({
    user_id: user.id,
    concept_id: concept.id,
    role: "user",
    content: lastUserMsg.content,
  });

  let client;
  try {
    client = getAnthropicClient();
  } catch (e) {
    return errorResponse(
      e instanceof Error ? e.message : "Anthropic client unavailable",
      503,
    );
  }

  const systemPrompt = buildSystemPrompt(concept);
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let assistantReply = "";
      try {
        const stream = client.messages.stream({
          model: TUTOR_MODEL,
          max_tokens: 2048,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            assistantReply += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }

        const final = await stream.finalMessage();
        const usage = final.usage;
        // Persist the assistant reply
        if (assistantReply.length > 0) {
          await supabase.from("tutor_messages").insert({
            user_id: user.id,
            concept_id: concept.id,
            role: "assistant",
            content: assistantReply,
          });
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              usage: {
                input_tokens: usage.input_tokens,
                output_tokens: usage.output_tokens,
                cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
                cache_creation_input_tokens:
                  usage.cache_creation_input_tokens ?? 0,
              },
            })}\n\n`,
          ),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "Stream failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function loadConcept(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<ConceptContext | null> {
  const { data, error } = await supabase
    .from("concepts")
    .select(
      "id, title, description, swe_analogy, phases!inner(number, title, tagline)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    swe_analogy: data.swe_analogy,
    phase: {
      number: data.phases.number,
      title: data.phases.title,
      tagline: data.phases.tagline,
    },
  };
}

function buildSystemPrompt(concept: ConceptContext): string {
  return `You are a patient, expert tutor helping a software engineer learn data engineering.

How to answer:
- Frame answers in terms of software engineering concepts the learner likely already knows (APIs, builds, queues, distributed tracing, RBAC, indexing, etc.).
- Be concise — 2 to 4 short paragraphs unless they ask for depth.
- Don't re-introduce the concept; assume they've read the page.
- Use concrete examples and small comparisons rather than abstract definitions.
- If they ask about something outside this concept, answer briefly and steer back unless it's clearly relevant.
- Never invent specific products, prices, or version numbers you're unsure about.

The learner is currently on:

Phase ${concept.phase.number}: ${concept.phase.title}${concept.phase.tagline ? ` — ${concept.phase.tagline}` : ""}

Concept: ${concept.title}

Curriculum description:
${concept.description}

SWE analogy from the curriculum:
${concept.swe_analogy}`;
}

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
