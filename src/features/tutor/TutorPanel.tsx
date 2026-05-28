"use client";

import { useEffect, useRef, useState } from "react";
import type { TutorMessage } from "./queries";

type LocalMessage = { role: "user" | "assistant"; content: string };

export function TutorPanel({
  conceptSlug,
  initialMessages,
}: {
  conceptSlug: string;
  initialMessages: TutorMessage[];
}) {
  const [open, setOpen] = useState(initialMessages.length > 0);
  const [messages, setMessages] = useState<LocalMessage[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content })),
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setError(null);
    const nextHistory: LocalMessage[] = [
      ...messages,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ];
    setMessages(nextHistory);
    setInput("");
    setStreaming(true);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptSlug,
          messages: nextHistory
            .slice(0, -1) // drop the empty assistant placeholder
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok || !response.body) {
        const errorBody = await response.text();
        throw new Error(errorBody || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { done: readDone, value } = await reader.read();
        done = readDone;
        if (value) buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          if (!ev.startsWith("data: ")) continue;
          const payload = JSON.parse(ev.slice("data: ".length));
          if (payload.error) {
            throw new Error(payload.error);
          }
          if (payload.text) {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last.role === "assistant") {
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: last.content + payload.text,
                };
              }
              return copy;
            });
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stream failed");
      // Remove the empty assistant placeholder on error
      setMessages((prev) =>
        prev[prev.length - 1]?.role === "assistant" &&
        prev[prev.length - 1]?.content === ""
          ? prev.slice(0, -1)
          : prev,
      );
    } finally {
      setStreaming(false);
    }
  }

  return (
    <section className="mt-8 rounded-md border border-foreground/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
            AI tutor
          </h2>
          <p className="mt-1 text-xs text-foreground/50">
            Ask Claude questions about this concept. Conversation is private to
            you.
          </p>
        </div>
        <span className="text-xs text-foreground/50">
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div className="border-t border-foreground/10 p-4">
          <div
            ref={scrollRef}
            className="max-h-[420px] space-y-3 overflow-y-auto pr-1"
          >
            {messages.length === 0 && !streaming && (
              <p className="text-sm text-foreground/50">
                No messages yet. Try asking how this concept maps to a SWE
                practice you already know.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "rounded-md bg-foreground/[0.04] p-3 text-sm"
                    : "rounded-md border border-foreground/10 p-3 text-sm leading-relaxed"
                }
              >
                <div className="mb-1 text-xs font-mono uppercase tracking-wider text-foreground/40">
                  {m.role === "user" ? "You" : "Tutor"}
                </div>
                <div className="whitespace-pre-wrap text-foreground/90">
                  {m.content || (streaming && m.role === "assistant" ? "…" : "")}
                </div>
              </div>
            ))}
            {error && (
              <p className="text-sm text-red-600">Error: {error}</p>
            )}
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the tutor…"
              disabled={streaming}
              className="flex-1 rounded-md border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {streaming ? "…" : "Send"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
