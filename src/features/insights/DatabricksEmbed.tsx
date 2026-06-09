"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { mintDashboardToken } from "./actions";

type Props = {
  instanceUrl: string;
  workspaceId: string;
  dashboardId: string;
};

type Status =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export function DatabricksEmbed({
  instanceUrl,
  workspaceId,
  dashboardId,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let instance: { destroy: () => void; initialize: () => void } | null = null;

    (async () => {
      try {
        // Mint initial token + load the SDK in parallel.
        const [tokenResult, sdk] = await Promise.all([
          mintDashboardToken(),
          // Dynamic import keeps the SDK out of the SSR bundle — it pokes at
          // `document` during construction.
          import("@databricks/aibi-client"),
        ]);
        if (cancelled) return;
        if (!tokenResult.ok) {
          setStatus({ kind: "error", message: tokenResult.error });
          return;
        }
        instance = new sdk.DatabricksDashboard({
          instanceUrl,
          workspaceId,
          dashboardId,
          token: tokenResult.token,
          // SDK calls this when the token is about to expire (~1 hour).
          getNewToken: async () => {
            const r = await mintDashboardToken();
            if (!r.ok) throw new Error(r.error);
            return r.token;
          },
          container,
          colorScheme: resolvedTheme === "dark" ? "dark" : "light",
        });
        instance.initialize();
        setStatus({ kind: "ready" });
      } catch (e) {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message:
            e instanceof Error
              ? e.message
              : "Failed to initialize the dashboard.",
        });
      }
    })();

    return () => {
      cancelled = true;
      try {
        instance?.destroy();
      } catch {
        // Best-effort cleanup; the SDK is occasionally noisy on destroy.
      }
    };
  }, [instanceUrl, workspaceId, dashboardId, resolvedTheme]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden rounded-md border border-foreground/10"
      />
      {status.kind === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-foreground/60">
          Loading dashboard…
        </div>
      )}
      {status.kind === "error" && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-md rounded-md border border-red-500/30 bg-red-500/[0.04] p-4 text-sm">
            <div className="font-medium text-red-700 dark:text-red-400">
              Couldn&apos;t load the dashboard
            </div>
            <p className="mt-1 text-red-700/80 dark:text-red-300">
              {status.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
