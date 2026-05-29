import type { ComparisonPayload } from "./types";

export function ComparisonTable({ payload }: { payload: ComparisonPayload }) {
  return (
    <section className="mt-8">
      {payload.title && (
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
          {payload.title}
        </h2>
      )}
      <div className="mt-3 overflow-hidden rounded-md border border-foreground/10">
        <div className="grid grid-cols-2 border-b border-foreground/10 bg-foreground/[0.03] text-xs font-semibold uppercase tracking-wider text-foreground/60">
          <div className="border-r border-foreground/10 p-3">
            {payload.left_label}
          </div>
          <div className="p-3">{payload.right_label}</div>
        </div>
        {payload.pairs.map((pair, i) => (
          <div
            key={i}
            className="grid grid-cols-2 border-b border-foreground/10 last:border-b-0"
          >
            <div className="border-r border-foreground/10 p-3 text-sm text-foreground/85">
              {pair.left}
            </div>
            <div className="p-3 text-sm text-foreground/85">{pair.right}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
