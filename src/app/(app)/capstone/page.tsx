import { createClient } from "@/lib/supabase/server";
import { getCapstoneSteps } from "@/features/capstone/queries";
import {
  setCapstoneStepStatus,
  setCapstoneStepNotes,
} from "@/features/capstone/actions";
import { MarkProgress } from "@/features/progress/MarkProgress";
import { NotesArea } from "@/features/notes/NotesArea";
import { Markdown } from "@/features/concept/sections/Markdown";

export default async function CapstonePage() {
  const supabase = await createClient();
  const steps = await getCapstoneSteps(supabase);
  const completed = steps.filter((s) => s.status === "completed").length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Capstone project</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Build one end-to-end pipeline alongside the curriculum. Each step
        exercises one phase. Tooling choice is yours; hints suggest popular
        options.
      </p>
      <div className="mt-3 text-sm tabular-nums text-foreground/70">
        {completed} / {steps.length} complete
      </div>

      <div className="mt-8 space-y-8">
        {steps.map((step, i) => (
          <article
            key={step.id}
            className="rounded-lg border border-foreground/10 p-5"
          >
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                  Step {i + 1}
                  {step.phase && (
                    <>
                      <span className="mx-2 text-foreground/30">·</span>
                      Phase {step.phase.number}: {step.phase.title}
                    </>
                  )}
                </div>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {step.title}
                </h2>
              </div>
              <MarkProgress
                initialStatus={step.status}
                onChange={setCapstoneStepStatus.bind(null, step.id)}
              />
            </header>

            <div className="mt-4">
              <Markdown>{step.description}</Markdown>
            </div>

            {step.hints && (
              <div className="mt-3 rounded-md bg-foreground/[0.03] p-3 text-sm text-foreground/70">
                <span className="font-semibold text-foreground/80">Hints: </span>
                <Markdown className="!text-sm !text-foreground/70 inline-block">
                  {step.hints}
                </Markdown>
              </div>
            )}

            <NotesArea
              initialBody={step.notes}
              onSave={setCapstoneStepNotes.bind(null, step.id)}
              label="Your step notes"
              placeholder="Track what you built, what you learned, what surprised you…"
              rows={4}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
