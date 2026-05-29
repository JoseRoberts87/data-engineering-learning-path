"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });

    const supabase = createClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== "undefined" ? window.location.origin : "");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/path` },
    });

    if (error) {
      setStatus({ kind: "error", message: error.message });
    } else {
      setStatus({ kind: "sent", email });
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Enter your email. We&apos;ll send you a one-time magic link — no password
        required.
      </p>

      {callbackError && status.kind === "idle" && (
        <div className="mt-4 rounded-md border border-red-700/30 bg-red-700/5 p-3 text-sm text-red-700">
          Sign-in link couldn&apos;t be verified ({callbackError}). The link may
          have expired or been used. Request a new one below.
        </div>
      )}

      {status.kind === "sent" ? (
        <div className="mt-6 rounded-md border border-foreground/20 bg-foreground/5 p-4 text-sm">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-1 text-foreground/70">
            A sign-in link was sent to <strong>{status.email}</strong>. Click it
            to continue.
          </p>
          {typeof window !== "undefined" &&
            (window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1") && (
              <p className="mt-3 text-xs text-foreground/50">
                In local development, the link arrives in Mailpit at{" "}
                <a
                  href="http://127.0.0.1:54324"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  127.0.0.1:54324
                </a>
                .
              </p>
            )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status.kind === "sending"}
              className="mt-1 block w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/50"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            disabled={status.kind === "sending" || !email}
            className="w-full rounded-md bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {status.kind === "sending" ? "Sending link…" : "Send magic link"}
          </button>

          {status.kind === "error" && (
            <p className="text-sm text-red-600">{status.message}</p>
          )}
        </form>
      )}
    </main>
  );
}
