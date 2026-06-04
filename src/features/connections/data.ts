// Concept connections — the structured form of de_concept_connections.md.
// Each edge captures a relationship between two concepts. The "strength"
// field controls default visibility (only "strong" edges show by default);
// "law" tags the recurring theme so we can filter by it (idempotency, time,
// log-abstraction, immutability, cost-as-bytes, stateless-vs-stateful,
// backward-compat).

export type ConnectionType =
  | "applies" // B applies the idea from A in a new context
  | "implements" // B is a concrete implementation of the abstract idea in A
  | "scales" // B is the platform-scale version of A
  | "foundation" // A is a prerequisite or substrate that B builds on
  | "shares-mechanism" // A and B solve different problems with the same underlying mechanism
  | "warns-about" // B is a pitfall or trade-off introduced by A
  | "creates-problem"; // A makes B's problem harder

export type RecurringLaw =
  | "idempotency"
  | "time"
  | "log-abstraction"
  | "immutability"
  | "cost-as-bytes"
  | "stateless-vs-stateful"
  | "backward-compat";

export type Connection = {
  from: string;
  to: string;
  label: string;
  type: ConnectionType;
  law?: RecurringLaw;
  strength: "strong" | "normal";
};

export const connections: Connection[] = [
  // ═══════════════════════════════════════════════════════════════════
  // The idempotency throughline — P1 → P3 → P4 → P5
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "idempotency-as-mindset",
    to: "idempotency",
    label: "The Phase 1 mindset becomes the Phase 3 mechanical patterns (MERGE, partition overwrite).",
    type: "scales",
    law: "idempotency",
    strength: "strong",
  },
  {
    from: "idempotency",
    to: "backfilling",
    label: "Backfills are reruns over historical windows. They only work because the pipeline is idempotent.",
    type: "foundation",
    law: "idempotency",
    strength: "strong",
  },
  {
    from: "idempotency",
    to: "incremental-vs-full-loads",
    label: "Idempotent reprocessing of a window is what makes incremental loads safe.",
    type: "foundation",
    law: "idempotency",
    strength: "strong",
  },
  {
    from: "idempotency",
    to: "failure-modes",
    label: "Retries with idempotent steps recover cleanly; retries against non-idempotent steps produce duplicates.",
    type: "foundation",
    law: "idempotency",
    strength: "strong",
  },
  {
    from: "idempotency",
    to: "delivery-semantics",
    label: "At-least-once + idempotent sink = effectively-once. The same idempotency, applied at the streaming boundary.",
    type: "applies",
    law: "idempotency",
    strength: "strong",
  },
  {
    from: "delivery-semantics",
    to: "state-management-in-streams",
    label: "The same checkpoint that snapshots state delivers effectively-once processing. Two faces of one mechanism.",
    type: "shares-mechanism",
    law: "idempotency",
    strength: "strong",
  },

  // ═══════════════════════════════════════════════════════════════════
  // The time throughline — P1 → P4 → P5
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "time-as-engineering-problem",
    to: "time-and-ordering",
    label: "The Phase 1 intuition (event time ≠ wall-clock) becomes the Phase 5 watermark machinery.",
    type: "scales",
    law: "time",
    strength: "strong",
  },
  {
    from: "time-as-engineering-problem",
    to: "backfilling",
    label: "\"Don't use now() in transforms\" — reprocessing March 15 should compute as if today were March 15.",
    type: "applies",
    law: "time",
    strength: "strong",
  },
  {
    from: "time-and-ordering",
    to: "windowing",
    label: "Watermarks decide when an event-time window is \"done enough\" to emit and close.",
    type: "foundation",
    law: "time",
    strength: "strong",
  },
  {
    from: "windowing",
    to: "state-management-in-streams",
    label: "Windowing creates state; state must be bounded. Session windows close so per-session state can be freed.",
    type: "creates-problem",
    law: "time",
    strength: "normal",
  },
  {
    from: "time-and-ordering",
    to: "stream-processing",
    label: "Event-time windowing is the discipline that makes stateful stream processing correct.",
    type: "foundation",
    law: "time",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // The log abstraction — P2 → P3 → P5 → P6
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "change-data-capture",
    to: "event-streams",
    label: "A database's WAL is an event stream. Same data structure underneath a binlog and Kafka.",
    type: "shares-mechanism",
    law: "log-abstraction",
    strength: "strong",
  },
  {
    from: "event-streams",
    to: "data-lake-warehouse-lakehouse",
    label: "Iceberg/Delta/Hudi are a transaction log + manifest over Parquet — git's commit log over a directory of files.",
    type: "shares-mechanism",
    law: "log-abstraction",
    strength: "strong",
  },
  {
    from: "slowly-changing-dimensions",
    to: "data-lake-warehouse-lakehouse",
    label: "SCD Type 2 is a per-row WAL; lakehouse time travel is a per-table WAL. Two implementations of \"keep the history.\"",
    type: "shares-mechanism",
    law: "log-abstraction",
    strength: "strong",
  },
  {
    from: "slowly-changing-dimensions",
    to: "data-lake-warehouse-lakehouse",
    label: "Application-level SCD2 vs storage-level time-travel — the lakehouse handles versioning the SCD pattern used to require.",
    type: "scales",
    law: "immutability",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // Immutability + versioning
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "failures-are-backlogs",
    to: "time-as-engineering-problem",
    label: "Append-only history is *why* late data can update old windows. The two ideas reinforce each other.",
    type: "foundation",
    law: "immutability",
    strength: "normal",
  },
  {
    from: "medallion-architecture",
    to: "data-lake-warehouse-lakehouse",
    label: "Bronze ≈ lake (raw, immutable); gold ≈ warehouse (curated). The lakehouse formalizes both layers.",
    type: "implements",
    law: "immutability",
    strength: "strong",
  },
  {
    from: "etl-vs-elt",
    to: "event-streams",
    label: "ELT keeps raw forever so transforms can be replayed — the same \"keep raw, transform repeatedly\" mantra as event-stream replayability.",
    type: "shares-mechanism",
    law: "immutability",
    strength: "normal",
  },
  {
    from: "data-lake-warehouse-lakehouse",
    to: "governance",
    label: "GDPR deletion is hard *exactly because* of immutability + replication. Lakehouse snapshots make right-to-be-forgotten harder, not easier.",
    type: "creates-problem",
    law: "immutability",
    strength: "strong",
  },

  // ═══════════════════════════════════════════════════════════════════
  // Cost = bytes touched — P1 → P2 → P3 → P5 → P6
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "scale-and-cost-as-design-axes",
    to: "cost-as-performance",
    label: "The Phase 1 instinct that scale and cost are design axes becomes Phase 6's law: performance and cost are the same axis.",
    type: "scales",
    law: "cost-as-bytes",
    strength: "strong",
  },
  {
    from: "normalization-vs-denormalization",
    to: "distributed-compute-and-shuffle",
    label: "Denormalizing pre-joins the data so the query doesn't have to. Avoiding a join means avoiding a shuffle.",
    type: "applies",
    law: "cost-as-bytes",
    strength: "strong",
  },
  {
    from: "distributed-compute-and-shuffle",
    to: "cost-as-performance",
    label: "Avoiding shuffles cuts compute time, which cuts the cloud bill. The shuffle is the most expensive thing per byte.",
    type: "applies",
    law: "cost-as-bytes",
    strength: "strong",
  },
  {
    from: "incremental-vs-full-loads",
    to: "cost-as-performance",
    label: "Process only new data → process less → pay less. Often a 100x+ cost reduction over full reloads.",
    type: "applies",
    law: "cost-as-bytes",
    strength: "strong",
  },
  {
    from: "batch-vs-real-time",
    to: "cost-as-performance",
    label: "Streaming bills continuously; batch bills once. Pick the latency the consumer's decision actually needs, not what's technically possible.",
    type: "applies",
    law: "cost-as-bytes",
    strength: "strong",
  },
  {
    from: "stream-processing",
    to: "cost-as-performance",
    label: "Streaming requires continuous compute. Take on its cost only when freshness genuinely pays back.",
    type: "applies",
    law: "cost-as-bytes",
    strength: "normal",
  },
  {
    from: "sla-for-data",
    to: "cost-as-performance",
    label: "\"Latency from the decision, not the data\" — paying for low latency you don't use is paying for nothing.",
    type: "applies",
    law: "cost-as-bytes",
    strength: "normal",
  },
  {
    from: "columnar-vs-row-storage",
    to: "cost-as-performance",
    label: "Reads only referenced columns. Direct multiplier on bytes scanned, hence on the bill.",
    type: "applies",
    law: "cost-as-bytes",
    strength: "strong",
  },
  {
    from: "partitioning-and-clustering",
    to: "cost-as-performance",
    label: "Prunes partitions and skips row groups. Stacks multiplicatively with columnar; the biggest single cost lever.",
    type: "applies",
    law: "cost-as-bytes",
    strength: "strong",
  },

  // ═══════════════════════════════════════════════════════════════════
  // Stateless vs stateful split
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "stream-processing",
    to: "state-management-in-streams",
    label: "The stateless/stateful split predicts where complexity lives. Stateful operators create every hard problem in streaming.",
    type: "foundation",
    law: "stateless-vs-stateful",
    strength: "strong",
  },
  {
    from: "distributed-compute-and-shuffle",
    to: "state-management-in-streams",
    label: "Same split: map/filter are linearly parallel; GROUP BY / JOIN require shuffles. Stateful work is the hard work in both worlds.",
    type: "shares-mechanism",
    law: "stateless-vs-stateful",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // Backward compatibility — P1 → P3 → P7
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "schemas-as-contracts",
    to: "data-contracts",
    label: "Phase 1's schema-as-contract intuition matures into Phase 7's CI-enforced platform discipline.",
    type: "scales",
    law: "backward-compat",
    strength: "strong",
  },
  {
    from: "schemas-as-contracts",
    to: "breaking-changes",
    label: "If schemas are contracts, breaking them requires the same discipline as breaking any public API.",
    type: "foundation",
    law: "backward-compat",
    strength: "strong",
  },
  {
    from: "data-contracts",
    to: "breaking-changes",
    label: "Contracts define the promise; breaking-change discipline manages how the promise is allowed to evolve.",
    type: "foundation",
    law: "backward-compat",
    strength: "strong",
  },
  {
    from: "data-quality-as-tests",
    to: "observability",
    label: "Per-pipeline tests scale up to platform-wide monitoring across hundreds of datasets.",
    type: "scales",
    law: "backward-compat",
    strength: "strong",
  },
  {
    from: "grain-is-everything",
    to: "breaking-changes",
    label: "Changing the grain (one row per session → one row per page view) is one of the most insidious breaking changes.",
    type: "warns-about",
    law: "backward-compat",
    strength: "normal",
  },
  {
    from: "delivery-semantics",
    to: "data-contracts",
    label: "End-to-end exactly-once requires every link to participate. The contract is what makes the chain explicit.",
    type: "applies",
    law: "backward-compat",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // P1 → later phases (the platform-scale ascent)
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "data-is-the-product",
    to: "self-serve-data",
    label: "Phase 1's product framing realized at platform scale: your dataset has customers; the paved road serves them.",
    type: "scales",
    strength: "strong",
  },
  {
    from: "data-is-the-product",
    to: "data-contracts",
    label: "If data is a product, it has an interface. Contracts make that interface explicit, versioned, and enforced.",
    type: "foundation",
    strength: "strong",
  },
  {
    from: "failures-are-backlogs",
    to: "failure-modes",
    label: "Phase 1's \"wrong is worse than late\" instinct industrialized as Phase 4's retry-and-recovery patterns.",
    type: "scales",
    strength: "strong",
  },
  {
    from: "failures-are-backlogs",
    to: "observability",
    label: "Detecting failures at the platform level — observability is how you see the backlog before it hurts.",
    type: "scales",
    strength: "normal",
  },
  {
    from: "statistical-testing",
    to: "data-quality-as-tests",
    label: "Phase 1's sampling intuition becomes Phase 3's executable assertions on every row.",
    type: "scales",
    strength: "strong",
  },
  {
    from: "statistical-testing",
    to: "observability",
    label: "Distribution monitoring (Phase 7) is statistical testing applied continuously at the platform layer.",
    type: "scales",
    strength: "normal",
  },
  {
    from: "batch-vs-real-time",
    to: "stream-processing",
    label: "The latency-vs-cost dial. Phase 1 names the question; Phase 5 names the mechanism.",
    type: "scales",
    strength: "strong",
  },
  {
    from: "understanding-data-consumers",
    to: "self-serve-data",
    label: "Knowing your consumers (Phase 1) is the substrate for building a self-serve platform they can use without you.",
    type: "scales",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // P2 → later phases (modeling becomes physical reality)
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "oltp-vs-olap",
    to: "columnar-vs-row-storage",
    label: "OLTP-vs-OLAP workload shape forces the physical layout: rows for point lookups, columns for scans.",
    type: "foundation",
    strength: "strong",
  },
  {
    from: "dimensional-modeling",
    to: "distributed-compute-and-shuffle",
    label: "Star-schema joins are the canonical broadcast-join case: small dimensions to every node, fact table stays put.",
    type: "applies",
    strength: "normal",
  },
  {
    from: "medallion-architecture",
    to: "transformation-layering",
    label: "Bronze/silver/gold is the same dataflow shape as staging/intermediate/mart — modeling and transformation use the same layering.",
    type: "shares-mechanism",
    strength: "strong",
  },
  {
    from: "data-vault",
    to: "slowly-changing-dimensions",
    label: "Data Vault is SCD-like history, but for the entire data model. Both are about \"never lose what was true.\"",
    type: "shares-mechanism",
    law: "immutability",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // P3 → later phases (movement scales to streaming + storage)
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "transformation-layering",
    to: "stream-processing",
    label: "Staging → intermediate → mart is a dataflow topology, just bounded. Stream processors are the unbounded version.",
    type: "scales",
    strength: "normal",
  },
  {
    from: "incremental-vs-full-loads",
    to: "backfilling",
    label: "Incremental forward + idempotent backward = a complete update story. Phase 4 backfills are what make incrementality robust.",
    type: "shares-mechanism",
    strength: "strong",
  },
  {
    from: "etl-vs-elt",
    to: "data-lake-warehouse-lakehouse",
    label: "ELT requires cheap storage + elastic compute — exactly what the cloud separation of storage and compute enabled.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "data-quality-as-tests",
    to: "data-contracts",
    label: "Tests enforce the contract; the contract is what the tests are checking *against*.",
    type: "foundation",
    strength: "strong",
  },

  // ═══════════════════════════════════════════════════════════════════
  // P4 → later phases (orchestration scales)
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "dags",
    to: "stream-processing",
    label: "Both are dataflow graphs. The orchestration DAG runs on a daily clock; the streaming topology runs forever.",
    type: "shares-mechanism",
    strength: "normal",
  },
  {
    from: "dependency-management",
    to: "stream-processing",
    label: "Time-partitioned dependencies (\"this hour's output depends on that hour's input\") translates to per-event causality in streams.",
    type: "shares-mechanism",
    strength: "normal",
  },
  {
    from: "backfilling",
    to: "partitioning-and-clustering",
    label: "Partition boundaries *are* backfill boundaries. The partition column you choose in P6 is the backfill granularity you live with in P4.",
    type: "shares-mechanism",
    strength: "strong",
  },
  {
    from: "sla-for-data",
    to: "observability",
    label: "Asset-level freshness policies (Phase 4) industrialized as platform-wide observability (Phase 7).",
    type: "scales",
    strength: "strong",
  },
  {
    from: "failure-modes",
    to: "observability",
    label: "Failure modes are what observability watches for. The two concepts compose: name the failure (P4), detect it (P7).",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "failure-modes",
    to: "delivery-semantics",
    label: "Same retry/idempotency logic, generalized to unbounded data and per-event boundaries.",
    type: "scales",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // P5 ↔ P6 (streaming meets physical storage)
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "state-management-in-streams",
    to: "data-lake-warehouse-lakehouse",
    label: "Two systems solving durable consistent state: Flink's distributed snapshots and lakehouse transaction logs.",
    type: "shares-mechanism",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // P6 → P7 (physical reality meets organizational reality)
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "cost-as-performance",
    to: "self-serve-data",
    label: "A self-serve platform without cost guardrails creates surprise bills. Governed self-serve bakes the limits in.",
    type: "warns-about",
    strength: "strong",
  },
  {
    from: "data-lake-warehouse-lakehouse",
    to: "breaking-changes",
    label: "Lakehouse schema evolution is the storage-level mechanism; breaking-change discipline is the social discipline that uses it.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "data-lake-warehouse-lakehouse",
    to: "self-serve-data",
    label: "Time travel + ACID + open formats are what make a *governed* self-serve platform possible on a lake.",
    type: "foundation",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // Within-phase reinforcements (sparingly — only the strongest)
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "event-streams",
    to: "stream-processing",
    label: "The log is the substrate; stream processing is the standing topology that consumes it.",
    type: "foundation",
    law: "log-abstraction",
    strength: "strong",
  },
  {
    from: "event-streams",
    to: "delivery-semantics",
    label: "Replayability and partition ordering are what make exactly-once semantics achievable in the first place.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "stream-processing",
    to: "windowing",
    label: "Aggregation needs a boundary; windowing is how the standing topology makes the unbounded finite.",
    type: "foundation",
    strength: "strong",
  },
  {
    from: "dags",
    to: "dependency-management",
    label: "DAGs encode the structure; dependency management is the runtime discipline of waiting for the right inputs.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "partitioning-and-clustering",
    to: "columnar-vs-row-storage",
    label: "Partitioning prunes whole files; columnar prunes columns within them. Same instinct, two granularities.",
    type: "shares-mechanism",
    law: "cost-as-bytes",
    strength: "strong",
  },
  {
    from: "data-contracts",
    to: "observability",
    label: "Contracts define the promise; observability detects when the promise is broken. The platform pair.",
    type: "foundation",
    strength: "strong",
  },
  {
    from: "self-serve-data",
    to: "governance",
    label: "Self-serve is impossible without governance — but governance without self-serve is the data swamp. Governed self-serve is the resolution.",
    type: "foundation",
    strength: "strong",
  },

  // ═══════════════════════════════════════════════════════════════════
  // The closing arc — Phase 7 reaching back to Phase 1
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "self-serve-data",
    to: "data-is-the-product",
    label: "Phase 7 closes the loop with Phase 1: the platform exists *because* data is a product with customers.",
    type: "implements",
    strength: "normal",
  },

  // ═══════════════════════════════════════════════════════════════════
  // Expansion pass — additional connections from the synthesis doc
  // ═══════════════════════════════════════════════════════════════════
  {
    from: "understanding-data-consumers",
    to: "data-contracts",
    label: "Knowing your consumers' needs is the substrate for writing a contract that genuinely captures them.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "understanding-data-consumers",
    to: "sla-for-data",
    label: "\"What latency does the decision actually need?\" — the consumer's answer drives the SLA.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "grain-is-everything",
    to: "dimensional-modeling",
    label: "Star-schema fact tables hinge on a clearly-named grain. Get the grain wrong and the whole model rots.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "dimensional-modeling",
    to: "slowly-changing-dimensions",
    label: "Dimensions need a history strategy. SCD types are how Kimball-style dimensions handle change.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "data-vault",
    to: "medallion-architecture",
    label: "Two competing layering philosophies for the warehouse — Data Vault is hub/link/sat; medallion is bronze/silver/gold.",
    type: "shares-mechanism",
    strength: "normal",
  },
  {
    from: "etl-vs-elt",
    to: "transformation-layering",
    label: "ELT pushes transformation into the warehouse, which is where dbt-style staging → intermediate → mart layering lives.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "transformation-layering",
    to: "medallion-architecture",
    label: "Bronze/silver/gold and staging/intermediate/mart are the same idea: layered transformations from raw to gold, each layer with stronger guarantees.",
    type: "shares-mechanism",
    strength: "strong",
  },
  {
    from: "change-data-capture",
    to: "incremental-vs-full-loads",
    label: "CDC is the gold-standard incremental: instead of inferring \"what's new\" via watermarks, you read the database's own log of changes.",
    type: "implements",
    strength: "strong",
  },
  {
    from: "change-data-capture",
    to: "delivery-semantics",
    label: "CDC streams need delivery guarantees — at-least-once + idempotent merge is the common pattern.",
    type: "applies",
    law: "idempotency",
    strength: "normal",
  },
  {
    from: "dependency-management",
    to: "backfilling",
    label: "Backfilling a node means re-running its upstream dependencies for the historical window — dependency-management defines what to walk.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "dags",
    to: "backfilling",
    label: "The DAG defines what \"the pipeline\" actually is. Backfills traverse the same DAG; failures propagate down it.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "failure-modes",
    to: "sla-for-data",
    label: "An SLA without an understood failure-mode catalog is wishful thinking. P4's failure-modes is the operational reality the SLA has to absorb.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "event-streams",
    to: "change-data-capture",
    label: "Event streams generalize CDC — both are append-only logs of changes; CDC reads a database log, streams accept any producer.",
    type: "shares-mechanism",
    law: "log-abstraction",
    strength: "strong",
  },
  {
    from: "windowing",
    to: "time-and-ordering",
    label: "Windows are defined in event time; watermarks are how you decide when a window is \"done enough\" to close.",
    type: "foundation",
    law: "time",
    strength: "strong",
  },
  {
    from: "stream-processing",
    to: "transformation-layering",
    label: "Stream topologies and batch transformation layers are the same dataflow primitive: operators in a DAG. Stream is just unbounded.",
    type: "shares-mechanism",
    strength: "normal",
  },
  {
    from: "delivery-semantics",
    to: "failure-modes",
    label: "The same retry/duplicate/loss trade-offs as Phase 4 failure modes, generalized to per-event granularity.",
    type: "scales",
    strength: "normal",
  },
  {
    from: "columnar-vs-row-storage",
    to: "oltp-vs-olap",
    label: "Columnar exists because OLAP scans wide; row exists because OLTP reads narrow. The workload determines the layout.",
    type: "foundation",
    strength: "strong",
  },
  {
    from: "partitioning-and-clustering",
    to: "backfilling",
    label: "Backfills are partition-scoped — \"re-run the March 15 partition.\" The partition is the unit of recovery.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "distributed-compute-and-shuffle",
    to: "dimensional-modeling",
    label: "Dimensions are usually small enough to broadcast; facts are too big to shuffle. The star schema is broadcast-join-friendly by construction.",
    type: "applies",
    strength: "normal",
  },
  {
    from: "data-lake-warehouse-lakehouse",
    to: "etl-vs-elt",
    label: "ELT's \"land raw cheaply, transform in the warehouse\" is precisely what cheap object storage + elastic compute enabled. The lakehouse is ELT's storage form.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "cost-as-performance",
    to: "stream-processing",
    label: "Streaming clusters bill continuously. Most analyst-facing use cases don't need it; cost-as-performance discipline is the gate.",
    type: "warns-about",
    law: "cost-as-bytes",
    strength: "normal",
  },
  {
    from: "observability",
    to: "data-quality-as-tests",
    label: "Quality tests are pipeline-scoped checks; observability extends the same idea to platform-wide continuous monitoring.",
    type: "scales",
    strength: "normal",
  },
  {
    from: "observability",
    to: "failure-modes",
    label: "You can only alert on a failure mode you've already named. Phase 4's failure catalog is the input to Phase 7's monitoring.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "governance",
    to: "data-lake-warehouse-lakehouse",
    label: "Column-level masking + row-level filtering are enforced at the query engine — which means the lakehouse query layer is where governance actually runs.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "self-serve-data",
    to: "data-contracts",
    label: "Self-serve consumers can only trust a dataset they can read the contract for. Catalogs surface contracts; contracts make self-serve safe.",
    type: "foundation",
    strength: "strong",
  },
  {
    from: "breaking-changes",
    to: "data-lake-warehouse-lakehouse",
    label: "Iceberg/Delta schema evolution is the storage substrate; breaking-change discipline is what stops you from using it dangerously.",
    type: "foundation",
    strength: "normal",
  },
  {
    from: "breaking-changes",
    to: "observability",
    label: "Semantic breaks pass type checks. Distribution monitoring is what catches them — the platform pairing for breaking-change safety.",
    type: "foundation",
    law: "backward-compat",
    strength: "strong",
  },
];
