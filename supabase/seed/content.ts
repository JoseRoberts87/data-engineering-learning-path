export type PhaseSeed = {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  sort_order: number;
};

export type ConceptSeed = {
  slug: string;
  phase_slug: string;
  title: string;
  description: string;
  swe_analogy: string;
  sort_order: number;
};

export const phases: PhaseSeed[] = [
  {
    slug: "thinking-in-data",
    number: 1,
    title: "Thinking in data, not requests",
    tagline: "The core mindset shift from SWE to DE",
    sort_order: 1,
  },
  {
    slug: "data-modeling-fundamentals",
    number: 2,
    title: "Data modeling fundamentals",
    tagline: "How data is structured for reads at scale, not writes",
    sort_order: 2,
  },
  {
    slug: "data-movement-and-transformation",
    number: 3,
    title: "Data movement and transformation",
    tagline: "ETL/ELT patterns and building reliable pipelines",
    sort_order: 3,
  },
  {
    slug: "pipeline-orchestration-and-reliability",
    number: 4,
    title: "Pipeline orchestration and reliability",
    tagline: "Scheduling, dependencies, failure handling at scale",
    sort_order: 4,
  },
  {
    slug: "streaming-and-event-driven-data",
    number: 5,
    title: "Streaming and event-driven data",
    tagline: "Processing data in motion, not just at rest",
    sort_order: 5,
  },
  {
    slug: "storage-scale-and-compute",
    number: 6,
    title: "Storage, scale, and compute",
    tagline: "How data is physically stored and queried at large scale",
    sort_order: 6,
  },
  {
    slug: "data-platform-thinking",
    number: 7,
    title: "Data platform thinking",
    tagline: "Treating data infrastructure as a product for internal users",
    sort_order: 7,
  },
];

export const concepts: ConceptSeed[] = [
  // Phase 1
  {
    slug: "data-is-the-product",
    phase_slug: "thinking-in-data",
    title: "Data is the product, not a side effect",
    description:
      "In data engineering, the dataset itself is what you ship. Schema stability, freshness, and correctness are not nice-to-haves — they are the deliverable. Downstream analysts, dashboards, and models depend on the shape of the data the same way clients depend on an API.",
    swe_analogy:
      "Like an API where the response shape and latency are the contract — except the consumer is an analyst or an ML model, and the response is a table that lives across time.",
    sort_order: 1,
  },
  {
    slug: "schemas-as-contracts",
    phase_slug: "thinking-in-data",
    title: "Schemas as contracts",
    description:
      "A published schema is a binding agreement with every downstream consumer. Renaming a column, dropping a field, or changing a type can silently break dashboards and models. Schema changes need the same care as API versioning: additive and nullable changes are usually safe; removals and type changes are breaking.",
    swe_analogy:
      "Like a TypeScript interface or a protobuf definition exposed to other teams. Unlike code, old data has to keep validating against the schema you ship today, so backward compatibility is non-negotiable.",
    sort_order: 2,
  },

  // Phase 2
  {
    slug: "normalization-vs-denormalization",
    phase_slug: "data-modeling-fundamentals",
    title: "Normalization vs. denormalization",
    description:
      "Normalization splits data across tables to remove redundancy; denormalization duplicates fields back together so reads don't have to join. Transactional systems lean normalized (cheap to update). Analytical systems lean denormalized (cheap to scan).",
    swe_analogy:
      "The DRY principle pulled against query latency. In application code you'd extract a shared module; in an analytics warehouse you'd often inline the fields, because joins at scan time over millions of rows are expensive.",
    sort_order: 1,
  },
  {
    slug: "oltp-vs-olap",
    phase_slug: "data-modeling-fundamentals",
    title: "OLTP vs. OLAP",
    description:
      "OLTP databases (Postgres, MySQL) store rows together — fast for fetching, updating, and deleting individual records by key. OLAP databases (BigQuery, Snowflake, ClickHouse) store columns together — fast for aggregating a few columns across millions of rows.",
    swe_analogy:
      "Picking the right data structure for the workload — a HashMap vs. a column-oriented array. Same data, very different access patterns and very different cost curves.",
    sort_order: 2,
  },

  // Phase 3
  {
    slug: "etl-vs-elt",
    phase_slug: "data-movement-and-transformation",
    title: "ETL vs. ELT",
    description:
      "ETL transforms data before loading it into the warehouse; ELT loads it raw and transforms inside the warehouse. ELT is the modern default because re-deriving curated tables from raw data is cheap when the warehouse provides the compute.",
    swe_analogy:
      "Whether to preprocess in middleware or store raw and shape it at read time. ELT favors the latter — cheaper iteration, easier debugging, fewer brittle preprocessing stages.",
    sort_order: 1,
  },
  {
    slug: "idempotency",
    phase_slug: "data-movement-and-transformation",
    title: "Idempotency",
    description:
      "A pipeline is idempotent when running it twice yields the same result as running it once. This is required for safe retries, partial failure recovery, and backfills. Typically achieved by merge-on-key writes, deterministic partition replacement, or transactional swaps.",
    swe_analogy:
      "The same property you want from a PUT or DELETE endpoint. Without it, every retry risks corrupting the dataset — and retries are not optional in distributed systems.",
    sort_order: 2,
  },

  // Phase 4
  {
    slug: "dags",
    phase_slug: "pipeline-orchestration-and-reliability",
    title: "DAGs (directed acyclic graphs)",
    description:
      "Pipelines are modeled as DAGs — tasks are nodes, dependencies are edges. The scheduler walks the graph in topological order: a task starts only when all its predecessors have completed successfully. Independent siblings run in parallel.",
    swe_analogy:
      "Like a build dependency tree — Makefile, Bazel, your CI's job graph. The data twist: the same DAG re-executes for each time partition (every hour, every day), and runs can be backfilled.",
    sort_order: 1,
  },
  {
    slug: "backfilling",
    phase_slug: "pipeline-orchestration-and-reliability",
    title: "Backfilling",
    description:
      "Re-running a pipeline against a historical window to fix bugs, populate a new derived table, or recover from data-quality issues. Often a much larger job than a single daily run, and only safe if the pipeline is idempotent.",
    swe_analogy:
      "Like replaying an event log to rebuild a projection. The catch: the schema and code may have evolved since the original window, so the backfill needs to handle both old and new shapes.",
    sort_order: 2,
  },

  // Phase 5
  {
    slug: "event-streams",
    phase_slug: "streaming-and-event-driven-data",
    title: "Event streams",
    description:
      "A durable, append-only, ordered log of events. Consumers track their own position and can replay from any point — events aren't 'consumed' by reading them. This is what makes streams the source of truth in event-driven systems.",
    swe_analogy:
      "Like a Kafka topic or Kinesis stream: a message bus that keeps history. Closer to a write-ahead log than to a traditional queue, where consuming removes messages.",
    sort_order: 1,
  },
  {
    slug: "time-and-ordering",
    phase_slug: "streaming-and-event-driven-data",
    title: "Time and ordering",
    description:
      "Event time (when something happened) is rarely equal to processing time (when your pipeline saw it). Late arrivals, out-of-order delivery, and clock skew are the norm. Stream processors use watermarks to bound how long a window stays open before being finalized.",
    swe_analogy:
      "Not really a SWE problem you've solved before — app backends usually pretend message order is reliable. The closest analogue is clock skew in distributed tracing, where you stitch spans from machines that disagree on now().",
    sort_order: 2,
  },

  // Phase 6
  {
    slug: "columnar-vs-row-storage",
    phase_slug: "storage-scale-and-compute",
    title: "Columnar vs. row storage",
    description:
      "Columnar formats (Parquet, ORC, Arrow) store all values of one column together — great for aggregations that touch a few columns over many rows. Row formats are better for fetching whole records. Choice of format can change query cost by an order of magnitude.",
    swe_analogy:
      "The struct-of-arrays vs. array-of-structs trade-off you'd hit writing high-performance systems code, but applied at the file-format and storage-engine level.",
    sort_order: 1,
  },
  {
    slug: "partitioning-and-clustering",
    phase_slug: "storage-scale-and-compute",
    title: "Partitioning and clustering",
    description:
      "Partitioning splits a table into separate files/locations by a key (usually a date), so queries with that key in their WHERE clause can skip whole partitions. Clustering sorts rows within a partition for further pruning. The key has to match how queries filter, or partitioning achieves nothing.",
    swe_analogy:
      "Closer to indexing than to sharding. You're not balancing write load across nodes — you're giving the query planner enough information to prune scan ranges.",
    sort_order: 2,
  },

  // Phase 7
  {
    slug: "data-contracts",
    phase_slug: "data-platform-thinking",
    title: "Data contracts",
    description:
      "A formal agreement between a producer team and consumer teams: what columns exist, what changes are allowed, when freshness is guaranteed, and how breaking changes will be handled. Often versioned, tested in CI, and enforced at write time.",
    swe_analogy:
      "API versioning, but for tables. Same problem class — semantic versioning, deprecation windows, compatibility tiers — applied to a dataset that consumers depend on.",
    sort_order: 1,
  },
  {
    slug: "observability",
    phase_slug: "data-platform-thinking",
    title: "Observability",
    description:
      "Knowing whether a pipeline is healthy, whether outputs are fresh, what's anomalous, and where data came from (lineage). Without it, broken data flows silently for days while everyone trusts the dashboards.",
    swe_analogy:
      "Distributed tracing for data: freshness metrics, row-count and null-rate checks, plus lineage graphs that connect every downstream table to the upstream jobs that built it.",
    sort_order: 2,
  },
];
