import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConceptWithContext } from "@/features/concept/queries";
import { MarkProgress } from "@/features/progress/MarkProgress";
import { setConceptProgress } from "@/features/progress/actions";
import { NotesArea } from "@/features/notes/NotesArea";
import { setConceptNote } from "@/features/notes/actions";
import { TutorPanel } from "@/features/tutor/TutorPanel";
import { getPriorTutorMessages } from "@/features/tutor/queries";
import { Markdown } from "@/features/concept/sections/Markdown";
import { renderSection } from "@/features/concept/sections";

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const concept = await getConceptWithContext(supabase, slug);
  if (!concept) notFound();
  const tutorHistory = await getPriorTutorMessages(supabase, concept.id);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href={`/phase/${concept.phase.slug}`}
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        ← Phase {concept.phase.number}: {concept.phase.title}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{concept.title}</h1>
        <MarkProgress
          initialStatus={concept.status}
          onChange={setConceptProgress.bind(null, concept.id)}
        />
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

      <NotesArea
        initialBody={concept.note}
        onSave={setConceptNote.bind(null, concept.id)}
      />

      <TutorPanel conceptSlug={concept.slug} initialMessages={tutorHistory} />
    </div>
  );
}
