import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConceptWithContext } from "@/features/concept/queries";
import { NotesArea } from "@/features/notes/NotesArea";
import { setConceptNote } from "@/features/notes/actions";
import { TutorPanel } from "@/features/tutor/TutorPanel";
import { getPriorTutorMessages } from "@/features/tutor/queries";
import { Markdown } from "@/features/concept/sections/Markdown";
import { renderSection } from "@/features/concept/sections";
import { ConceptConnections } from "@/features/connections/ConceptConnections";
import { ExplanationEvaluator } from "@/features/explanation/ExplanationEvaluator";
import { submitExplanation } from "@/features/explanation/actions";
import { getExplanationRecord } from "@/features/explanation/queries";
import { CodeChallenge } from "@/features/challenge/CodeChallenge";
import { submitChallenge } from "@/features/challenge/actions";
import {
  getChallengeForConcept,
  getChallengeSubmission,
} from "@/features/challenge/queries";
import { formatMinutes } from "@/lib/format";

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const concept = await getConceptWithContext(supabase, slug);
  if (!concept) notFound();
  const [tutorHistory, explanationRecord, challenge, challengeSubmission] =
    await Promise.all([
      getPriorTutorMessages(supabase, concept.id),
      getExplanationRecord(supabase, concept.id),
      getChallengeForConcept(supabase, concept.id),
      getChallengeSubmission(supabase, concept.id),
    ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href={`/phase/${concept.phase.slug}`}
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        ← Phase {concept.phase.number}: {concept.phase.title}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{concept.title}</h1>
          <div className="mt-1 text-xs tabular-nums text-foreground/50">
            {formatMinutes(concept.estimated_minutes)}
          </div>
        </div>
        {concept.status === "completed" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-700/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span>✓</span> Complete
          </span>
        ) : null}
      </div>

      <section className="mt-6">
        <Markdown>{concept.description}</Markdown>
      </section>

      <section className="mt-8 rounded-md border border-foreground/10 bg-foreground/[0.03] p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
          The SWE analogy
        </h2>
        <div className="mt-2">
          <Markdown>{concept.swe_analogy}</Markdown>
        </div>
      </section>

      {concept.sections.map((s) => renderSection(s))}

      {concept.resources.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Resources
          </h2>
          <ul className="mt-3 space-y-2">
            {concept.resources.map((r) => (
              <li key={r.url} className="text-sm">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:no-underline"
                >
                  {r.title}
                </a>
                <span className="ml-2 text-xs text-foreground/50">
                  {r.resource_type}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConceptConnections supabase={supabase} conceptSlug={concept.slug} />

      {challenge ? (
        <CodeChallenge
          challenge={challenge}
          initialSubmission={challengeSubmission}
          onSubmit={submitChallenge}
        />
      ) : null}

      <ExplanationEvaluator
        conceptId={concept.id}
        initialRecord={explanationRecord}
        onSubmit={submitExplanation}
      />

      <NotesArea
        initialBody={concept.note}
        onSave={setConceptNote.bind(null, concept.id)}
      />

      <TutorPanel conceptSlug={concept.slug} initialMessages={tutorHistory} />
    </div>
  );
}
