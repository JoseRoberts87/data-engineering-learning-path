import { createClient } from "@/lib/supabase/server";
import { getGraphConcepts } from "@/features/connections/queries";
import { ConnectionsGraph } from "@/features/connections/ConnectionsGraph";
import { ConnectionsList } from "@/features/connections/ConnectionsList";

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const concepts = await getGraphConcepts(supabase);

  return (
    <>
      {/* Mobile / small screens: phase-grouped list */}
      <div className="md:hidden">
        <ConnectionsList concepts={concepts} />
      </div>
      {/* Desktop / md+: interactive React Flow graph */}
      <div className="hidden md:block">
        <ConnectionsGraph concepts={concepts} />
      </div>
    </>
  );
}
