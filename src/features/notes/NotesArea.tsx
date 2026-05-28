"use client";

import { useEffect, useState } from "react";

type Status = "saved" | "dirty" | "saving" | "error";

const statusText: Record<Status, string> = {
  saved: "Saved",
  dirty: "Unsaved changes…",
  saving: "Saving…",
  error: "Save failed",
};

const statusColor: Record<Status, string> = {
  saved: "text-foreground/40",
  dirty: "text-foreground/60",
  saving: "text-foreground/60",
  error: "text-red-600",
};

export function NotesArea({
  initialBody,
  onSave,
  label = "Your notes",
  placeholder = "Take notes — what clicked, what didn't, what to come back to…",
  rows = 6,
}: {
  initialBody: string;
  onSave: (body: string) => Promise<void>;
  label?: string;
  placeholder?: string;
  rows?: number;
}) {
  const [body, setBody] = useState(initialBody);
  const [lastSaved, setLastSaved] = useState(initialBody);
  const [status, setStatus] = useState<Status>("saved");

  useEffect(() => {
    if (body === lastSaved) {
      setStatus((s) => (s === "error" ? s : "saved"));
      return;
    }
    setStatus("dirty");
    const handle = setTimeout(async () => {
      setStatus("saving");
      try {
        await onSave(body);
        setLastSaved(body);
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [body, lastSaved, onSave]);

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
          {label}
        </h2>
        <span className={`text-xs tabular-nums ${statusColor[status]}`}>
          {statusText[status]}
        </span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 block w-full resize-y rounded-md border border-foreground/15 bg-transparent p-3 text-sm leading-relaxed outline-none focus:border-foreground/40"
      />
    </section>
  );
}
