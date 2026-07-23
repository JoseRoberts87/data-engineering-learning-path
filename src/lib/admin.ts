import type { User } from "@supabase/supabase-js";

// Admin authorization is keyed off `app_metadata.role === 'admin'` on the
// Supabase auth user. `app_metadata` is writeable only by the service
// role (not by the user themselves), is carried in the JWT, and can be
// read by RLS policies later when we have admin-only data.
//
// To grant a user the admin role, run:
//   bun run grant:admin <email>
// (or set raw_app_meta_data.role = 'admin' directly via Supabase Studio's
// SQL editor — see scripts/grant-admin.ts for the equivalent SQL).

export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  return (user.app_metadata as { role?: string } | null)?.role === "admin";
}
