export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="h-7 w-48 animate-pulse rounded bg-foreground/10" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-foreground/10" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-foreground/10 bg-foreground/[0.02]"
          />
        ))}
      </div>
    </div>
  );
}
