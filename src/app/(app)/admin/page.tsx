import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 404 (not 403/redirect) so the existence of an admin route doesn't
  // leak to non-admins. The (app) layout already enforces login —
  // this is the second gate on top.
  if (!isAdmin(user)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <span className="rounded-full border border-foreground/15 px-2.5 py-0.5 text-xs text-foreground/60">
          {user!.email}
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground/60">
        Tools here are visible only to admin accounts.
      </p>

      <section className="mt-8 rounded-lg border border-dashed border-foreground/15 p-6 text-sm text-foreground/50">
        Nothing here yet. Future admin tools will land in this section.
      </section>
    </div>
  );
}
