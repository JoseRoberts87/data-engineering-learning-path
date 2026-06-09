"use server";

import { createClient } from "@/lib/supabase/server";

// Hard-coded to match page.tsx — promote to env vars when we wire this
// to a different workspace.
const HOST = "https://dbc-5e71dd07-3f14.cloud.databricks.com";
const DASHBOARD_ID = "01f15487cc101709b676c4034182e920";

export type MintResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

/**
 * Mint a user-scoped embed token for the external-embed flow.
 *
 * Three-step exchange (per Databricks docs):
 *   1. POST /oidc/v1/token with client_credentials → broad workspace OAuth token
 *   2. GET  /api/2.0/lakeview/dashboards/{id}/published/tokeninfo
 *      with that OAuth token + external_viewer_id + external_value
 *      → token-info response containing `authorization_details` (the
 *        per-user claims the next call needs to encode)
 *   3. POST /oidc/v1/token again, but this time with all the params from
 *      step 2 (including the JSON-stringified authorization_details)
 *      → user-scoped access token. THIS is what the SDK accepts.
 *
 * external_viewer_id is the audit-log identifier (no PII; we use the
 * Supabase user UUID). external_value is what surfaces as
 * __aibi_external_value in dashboard SQL queries for per-user filtering.
 *
 * Workspace admin must also add our origin (e.g. http://localhost:3000)
 * to the dashboard embedding allowlist in Databricks settings, or the
 * SDK will refuse to render even with a valid token.
 */
export async function mintDashboardToken(): Promise<MintResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const clientId = process.env.DATABRICKS_CLIENT_ID;
  const clientSecret = process.env.DATABRICKS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {
      ok: false,
      error:
        "Databricks OAuth credentials not configured (DATABRICKS_CLIENT_ID and/or DATABRICKS_CLIENT_SECRET missing).",
    };
  }
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  // Step 1: workspace-wide OAuth token
  const oauthRes = await fetch(`${HOST}/oidc/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "all-apis",
    }).toString(),
    cache: "no-store",
  });
  if (!oauthRes.ok) {
    const body = await oauthRes.text();
    return {
      ok: false,
      error: `Step 1 (OAuth) failed (${oauthRes.status}): ${body.slice(0, 300)}`,
    };
  }
  const { access_token: oauthToken } = (await oauthRes.json()) as {
    access_token: string;
  };

  // Step 2: per-user token info. external_viewer_id = our user UUID for
  // audit. external_value duplicates it because we have no PII-bearing
  // per-user filter to inject into dashboard SQL right now.
  const tokenInfoUrl = new URL(
    `${HOST}/api/2.0/lakeview/dashboards/${DASHBOARD_ID}/published/tokeninfo`,
  );
  tokenInfoUrl.searchParams.set("external_viewer_id", user.id);
  tokenInfoUrl.searchParams.set("external_value", user.id);

  const tokenInfoRes = await fetch(tokenInfoUrl, {
    headers: { Authorization: `Bearer ${oauthToken}` },
    cache: "no-store",
  });
  if (!tokenInfoRes.ok) {
    const body = await tokenInfoRes.text();
    return {
      ok: false,
      error: `Step 2 (tokeninfo) failed (${tokenInfoRes.status}): ${body.slice(0, 300)}`,
    };
  }
  const tokenInfo = (await tokenInfoRes.json()) as Record<string, unknown>;

  // Step 3: re-mint the OAuth token with the per-user authorization_details
  // (and any other params returned in step 2) folded back into the request.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(tokenInfo)) {
    if (key === "authorization_details") {
      params.set(key, JSON.stringify(value));
    } else if (typeof value === "string") {
      params.set(key, value);
    } else if (value !== null && value !== undefined) {
      params.set(key, JSON.stringify(value));
    }
  }
  params.set("grant_type", "client_credentials");

  const scopedRes = await fetch(`${HOST}/oidc/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: params.toString(),
    cache: "no-store",
  });
  if (!scopedRes.ok) {
    const body = await scopedRes.text();
    return {
      ok: false,
      error: `Step 3 (scoped token) failed (${scopedRes.status}): ${body.slice(0, 300)}`,
    };
  }
  const { access_token } = (await scopedRes.json()) as { access_token: string };
  return { ok: true, token: access_token };
}
