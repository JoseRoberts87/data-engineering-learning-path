// Mobile fallback: a phase-grouped list of concepts and their connections.
// Renders the same data as the graph but readable on a small screen.

import Link from "next/link";
import { connections } from "./data";
import type { GraphConcept } from "./queries";

type Props = {
  concepts: GraphConcept[];
};

export function ConnectionsList({ concepts }: Props) {
  const byPhase = new Map<number, GraphConcept[]>();
  for (const c of concepts) {
    if (!byPhase.has(c.phase_number)) byPhase.set(c.phase_number, []);
    byPhase.get(c.phase_number)!.push(c);
  }
  for (const list of byPhase.values()) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }
  const phases = Array.from(byPhase.entries()).sort(([a], [b]) => a - b);

  // Build a lookup: slug → titles for label rendering.
  const titleBySlug = new Map(concepts.map((c) => [c.slug, c.title]));

  // For each concept, gather its outgoing connections.
  const outgoing = new Map<string, typeof connections>();
  for (const conn of connections) {
    if (!outgoing.has(conn.from)) outgoing.set(conn.from, []);
    outgoing.get(conn.from)!.push(conn);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Concept connections
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        How concepts relate across phases. Open the desktop view for the
        interactive graph.
      </p>

      {phases.map(([n, conceptList]) => (
        <section key={n} className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            Phase {n} · {conceptList[0]?.phase_title}
          </h2>
          <ul className="mt-3 space-y-4">
            {conceptList.map((concept) => {
              const conns = outgoing.get(concept.slug) ?? [];
              return (
                <li
                  key={concept.slug}
                  className="rounded-lg border border-foreground/10 p-4"
                >
                  <Link
                    href={`/concept/${concept.slug}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {concept.title}
                  </Link>
                  {conns.length > 0 ? (
                    <ul className="mt-2 space-y-1.5 text-xs text-foreground/70">
                      {conns.map((c, i) => (
                        <li key={i}>
                          <span className="text-foreground/40">→ </span>
                          <Link
                            href={`/concept/${c.to}`}
                            className="font-medium hover:underline"
                          >
                            {titleBySlug.get(c.to) ?? c.to}
                          </Link>
                          <span className="text-foreground/40"> · </span>
                          <span>{c.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-foreground/40">
                      No outgoing connections.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
