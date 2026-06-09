import { DatabricksEmbed } from "@/features/insights/DatabricksEmbed";

// Hard-coded for now — promote to env vars when we wire to a different
// workspace. The OAuth token is minted server-side on each request.
const DASHBOARD = {
  instanceUrl: "https://dbc-5e71dd07-3f14.cloud.databricks.com",
  workspaceId: "7474657236510673",
  dashboardId: "01f15487cc101709b676c4034182e920",
};

export default function DatabricksPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b border-foreground/10 px-6 py-3">
        <h1 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
          Databricks dashboard
        </h1>
        <p className="mt-1 text-xs text-foreground/50">
          Embedded AI/BI dashboard. Token is minted server-side via OAuth M2M
          on each request.
        </p>
      </div>
      <div className="flex-1 p-4">
        <DatabricksEmbed
          instanceUrl={DASHBOARD.instanceUrl}
          workspaceId={DASHBOARD.workspaceId}
          dashboardId={DASHBOARD.dashboardId}
        />
      </div>
    </div>
  );
}
