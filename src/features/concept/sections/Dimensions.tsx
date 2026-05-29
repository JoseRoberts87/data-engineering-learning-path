import type { DimensionsPayload } from "./types";

export function Dimensions({ payload }: { payload: DimensionsPayload }) {
  return (
    <section className="mt-8">
      {payload.title && (
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
          {payload.title}
        </h2>
      )}
      {payload.intro && (
        <p className="mt-2 text-sm text-foreground/70">{payload.intro}</p>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {payload.items.map((item, i) => (
          <div
            key={i}
            className="rounded-md border border-foreground/10 p-4"
          >
            <div className="text-sm font-semibold">{item.name}</div>
            <p className="mt-1 text-sm text-foreground/75">{item.description}</p>
            {item.swe_parallel && (
              <p className="mt-2 text-xs text-foreground/55">
                <span className="font-mono uppercase tracking-wider">
                  SWE parallel:
                </span>{" "}
                {item.swe_parallel}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
