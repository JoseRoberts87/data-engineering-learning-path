import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/features/dashboard/queries";

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const data = await getDashboardData(supabase);

  const overallPct = pct(data.overall.completed, data.overall.total);
  const capstonePct = pct(data.capstone.completed, data.capstone.total);
  const checkpointsPassed = data.phases.filter((p) => p.checkpointPassed).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Where you are across the path.
      </p>

      <section className="mt-8 rounded-lg border border-foreground/10 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Overall progress
          </h2>
          <span className="text-2xl font-semibold tabular-nums">
            {overallPct}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full bg-foreground/70 transition-[width]"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-foreground/60 tabular-nums">
          {data.overall.completed} / {data.overall.total} concepts completed
        </p>
      </section>

      {data.nextIncomplete && (
        <Link
          href={`/concept/${data.nextIncomplete.conceptSlug}`}
          className="mt-4 block rounded-lg border border-foreground/15 p-5 transition hover:border-foreground/40 hover:bg-foreground/[0.02]"
        >
          <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
            Continue where you left off
          </div>
          <div className="mt-1 text-base font-semibold">
            {data.nextIncomplete.conceptTitle}
          </div>
          <div className="mt-1 text-sm text-foreground/60">
            Phase {data.nextIncomplete.phaseNumber}: {data.nextIncomplete.phaseTitle}
          </div>
        </Link>
      )}

      <Link
        href="/connections"
        className="mt-4 block rounded-lg border border-foreground/15 p-5 transition hover:border-foreground/40 hover:bg-foreground/[0.02]"
      >
        <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
          Concept map
        </div>
        <div className="mt-1 text-base font-semibold">
          See how the concepts connect across phases
        </div>
        <div className="mt-1 text-sm text-foreground/60">
          Interactive graph · filter by recurring theme · click a node to
          drill in
        </div>
      </Link>

      <section className="mt-8 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-foreground/10 p-4 text-center">
          <div className="text-2xl font-semibold tabular-nums">
            {data.overall.completed}
            <span className="text-foreground/40 text-base">
              /{data.overall.total}
            </span>
          </div>
          <div className="mt-1 text-xs text-foreground/50">Concepts done</div>
        </div>
        <div className="rounded-md border border-foreground/10 p-4 text-center">
          <div className="text-2xl font-semibold tabular-nums">
            {checkpointsPassed}
            <span className="text-foreground/40 text-base">
              /{data.phases.length}
            </span>
          </div>
          <div className="mt-1 text-xs text-foreground/50">Checkpoints passed</div>
        </div>
        <div className="rounded-md border border-foreground/10 p-4 text-center">
          <div className="text-2xl font-semibold tabular-nums">
            {data.capstone.completed}
            <span className="text-foreground/40 text-base">
              /{data.capstone.total}
            </span>
          </div>
          <div className="mt-1 text-xs text-foreground/50">Capstone steps</div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
          By phase
        </h2>
        <div className="mt-3 space-y-2">
          {data.phases.map((p) => {
            const phasePct = pct(p.completed, p.total);
            return (
              <Link
                key={p.id}
                href={`/phase/${p.slug}`}
                className="block rounded-md border border-foreground/10 p-4 transition hover:border-foreground/30 hover:bg-foreground/[0.02]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                        Phase {p.number}
                      </span>
                      {p.checkpointPassed && (
                        <span className="rounded-full border border-green-700/40 bg-green-700/10 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          Passed{p.bestCheckpointScore !== null ? ` ${p.bestCheckpointScore}%` : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-medium">{p.title}</div>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <div className="text-sm">
                      {p.completed} / {p.total}
                    </div>
                    <div className="text-xs text-foreground/50">{phasePct}%</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full bg-foreground/70 transition-[width]"
                    style={{ width: `${phasePct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <Link
          href="/capstone"
          className="block rounded-lg border border-foreground/10 p-5 transition hover:border-foreground/30 hover:bg-foreground/[0.02]"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
              Capstone
            </h2>
            <span className="text-xl font-semibold tabular-nums">
              {capstonePct}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full bg-foreground/70 transition-[width]"
              style={{ width: `${capstonePct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-foreground/60">
            {data.capstone.completed} / {data.capstone.total} steps complete
            {data.capstone.nextStepTitle && (
              <>
                {" "}
                · next: <span className="text-foreground/80">{data.capstone.nextStepTitle}</span>
              </>
            )}
          </p>
        </Link>
      </section>
    </div>
  );
}
