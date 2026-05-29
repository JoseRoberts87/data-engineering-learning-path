import type { FailureCatalogPayload } from "./types";

export function FailureCatalog({ payload }: { payload: FailureCatalogPayload }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
        {payload.title ?? "Common silent failures"}
      </h2>
      {payload.intro && (
        <p className="mt-2 text-sm text-foreground/70">{payload.intro}</p>
      )}
      <div className="mt-3 space-y-2">
        {payload.items.map((item, i) => (
          <details
            key={i}
            className="rounded-md border border-foreground/10 bg-foreground/[0.02] open:border-foreground/30"
          >
            <summary className="cursor-pointer list-none p-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block w-3 select-none text-foreground/50">
                +
              </span>
              {item.scenario}
            </summary>
            <div className="space-y-3 border-t border-foreground/10 p-3 text-sm">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                  Consequence
                </div>
                <p className="mt-1 text-foreground/85">{item.consequence}</p>
              </div>
              {item.de_catches_it && (
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                    What catches it
                  </div>
                  <p className="mt-1 text-foreground/85">{item.de_catches_it}</p>
                </div>
              )}
              {item.swe_equivalent && (
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                    SWE equivalent
                  </div>
                  <p className="mt-1 text-foreground/70">{item.swe_equivalent}</p>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
