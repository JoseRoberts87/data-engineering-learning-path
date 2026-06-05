import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Builds the redirect base from the actual Host header rather than
// request.url, which under Docker reflects HOSTNAME=0.0.0.0 (set so Next.js
// binds to all interfaces) and would otherwise leak into redirect Locations.
function getOrigin(request: NextRequest): string {
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/path";

  // Surface whatever Supabase already returned in the URL — useful when
  // the verify endpoint itself failed before reaching us.
  const supabaseError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (!code) {
    const reason = supabaseError ?? "missing_code";
    console.error("[auth/callback] no code in callback URL:", reason);
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(reason)}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // The most common failures here are (a) the verifier cookie is missing
  // because the user clicked the email in a different browser/device than
  // where they submitted the form, (b) the link's already been consumed
  // (Gmail and corporate scanners pre-fetch URLs to scan them), or (c) the
  // Supabase redirect-URL allowlist doesn't include this origin.
  const reason = error.message || error.code || "exchange_failed";
  console.error("[auth/callback] exchange failed:", {
    reason,
    code: error.code,
    name: error.name,
  });
  return NextResponse.redirect(
    `${origin}/auth?error=${encodeURIComponent(reason)}`,
  );
}
