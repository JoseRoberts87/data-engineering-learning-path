import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { connections, type Connection } from "./data";

type ConceptLookup = Map<string, { title: string; phase_number: number }>;

async function getConceptLookup(
  supabase: SupabaseClient<Database>,
): Promise<ConceptLookup> {
  const { data, error } = await supabase
    .from("phases")
    .select("number, concepts(slug, title)");
  if (error) throw error;

  const lookup: ConceptLookup = new Map();
  for (const phase of data ?? []) {
    for (const concept of phase.concepts ?? []) {
      lookup.set(concept.slug, {
        title: concept.title,
        phase_number: phase.number,
      });
    }
  }
  return lookup;
}

const PHASE_DOT: Record<number, string> = {
  1: "bg-amber-500",
  2: "bg-blue-500",
  3: "bg-green-500",
  4: "bg-pink-500",
  5: "bg-purple-500",
  6: "bg-red-500",
  7: "bg-teal-500",
};

type Props = {
  supabase: SupabaseClient<Database>;
  conceptSlug: string;
};

export async function ConceptConnections({ supabase, conceptSlug }: Props) {
  const lookup = await getConceptLookup(supabase);

  const outgoing = connections.filter((c) => c.from === conceptSlug);
  const incoming = connections.filter((c) => c.to === conceptSlug);

  if (outgoing.length === 0 && incoming.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
          Connects to
        </h2>
        <Link
          href={`/connections?focus=${conceptSlug}`}
          className="text-xs text-foreground/60 underline hover:text-foreground"
        >
          See in graph →
        </Link>
      </div>

      {outgoing.length > 0 && (
        <ConnectionList
          direction="out"
          conns={outgoing}
          lookup={lookup}
        />
      )}
      {incoming.length > 0 && (
        <ConnectionList
          direction="in"
          conns={incoming}
          lookup={lookup}
        />
      )}
    </section>
  );
}

function ConnectionList({
  direction,
  conns,
  lookup,
}: {
  direction: "in" | "out";
  conns: Connection[];
  lookup: ConceptLookup;
}) {
  const heading =
    direction === "out"
      ? "Builds on / leads to"
      : "Built on / referenced by";

  return (
    <div className="mt-4">
      <h3 className="text-xs font-medium text-foreground/50">{heading}</h3>
      <ul className="mt-2 space-y-2">
        {conns.map((c, i) => {
          const otherSlug = direction === "out" ? c.to : c.from;
          const other = lookup.get(otherSlug);
          if (!other) return null;
          return (
            <li
              key={`${direction}-${i}-${otherSlug}`}
              className="rounded-md border border-foreground/10 p-3 text-sm transition hover:border-foreground/30 hover:bg-foreground/[0.02]"
            >
              <Link href={`/concept/${otherSlug}`} className="block">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      PHASE_DOT[other.phase_number] ?? "bg-foreground/30"
                    }`}
                    title={`Phase ${other.phase_number}`}
                  />
                  <span className="font-medium">{other.title}</span>
                  <span className="ml-auto text-xs text-foreground/40">
                    {labelForType(c.type)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-foreground/60">
                  {c.label}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function labelForType(type: Connection["type"]): string {
  switch (type) {
    case "applies":
      return "applies";
    case "implements":
      return "implements";
    case "scales":
      return "scales up";
    case "foundation":
      return "foundation";
    case "shares-mechanism":
      return "shares mechanism";
    case "warns-about":
      return "warns about";
    case "creates-problem":
      return "creates problem";
  }
}
