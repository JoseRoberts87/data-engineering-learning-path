import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Data Engineering Learning Path
      </h1>
      <p className="mt-4 text-lg text-foreground/70">
        A concept-first curriculum for software engineers. Seven phases, framed
        against the SWE practices you already know — APIs, builds, queues,
        tracing, RBAC.
      </p>
      <p className="mt-3 text-base text-foreground/60">
        Browse the path, take notes, validate your understanding with phase
        checkpoints, and build an end-to-end pipeline as a capstone.
      </p>

      <div className="mt-8">
        {user ? (
          <Link
            href="/path"
            className="inline-block rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Continue to your path
          </Link>
        ) : (
          <Link
            href="/auth"
            className="inline-block rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
          >
            Sign in to start
          </Link>
        )}
      </div>
    </main>
  );
}
