#!/usr/bin/env bun
//
// Grant admin role to a Supabase auth user by email.
//
// Writes `app_metadata.role = 'admin'` via the admin API — server-only,
// using the service-role key. The user is then recognised as an admin
// by isAdmin() in src/lib/admin.ts.
//
// Usage:
//   bun run grant:admin <email>
//
// Or as raw SQL (run in Supabase Studio's SQL editor):
//   UPDATE auth.users
//   SET raw_app_meta_data =
//     COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
//   WHERE email = 'someone@example.com';
//
// After granting, the user must sign out and sign back in for the new
// claim to land in their JWT — Supabase doesn't push the change to
// existing sessions.

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: bun run grant:admin <email>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment. Check .env.local.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

// Page through auth users to find the one with this email. The admin
// listUsers endpoint paginates with a default page size of 50; for our
// scale a single page is always enough but we honour it correctly.
async function findUserByEmail(target: string) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === target.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}

const user = await findUserByEmail(email);
if (!user) {
  console.error(
    `No user found with email ${email}. They need to sign in at least once before being granted admin.`,
  );
  process.exit(1);
}

const existingAppMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: { ...existingAppMeta, role: "admin" },
});
if (updateError) {
  console.error("Failed to update app_metadata:", updateError);
  process.exit(1);
}

console.log(`✓ Granted admin to ${email} (user_id ${user.id})`);
console.log("  They must sign out and back in for the new role to take effect.");
