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
      "In data engineering the dataset itself is the deliverable — analysts, dashboards, and models depend on its shape, freshness, and correctness. \"Broken\" is mostly silent: a pipeline can complete green while emitting subtly wrong numbers (a retry that duplicates rows, a join that fans out one-to-many, an upstream column going 20% null after a frontend deploy). Treating data as a product means SLAs (freshness, completeness, accuracy), health metrics on the pipeline itself, lineage so you can trace a bad number to its source, and a backlog of datasets the way SWEs have a backlog of features.",
    swe_analogy:
      "Like an API where the response shape and freshness *are* the contract — except the consumer doesn't get a 500 when the number is wrong. The failure is silent and erodes trust permanently. Nobody pages oncall when revenue is off by 3%; they just stop trusting the dashboard.",
    sort_order: 1,
  },
  {
    slug: "batch-vs-real-time",
    phase_slug: "thinking-in-data",
    title: "Batch vs. real-time processing",
    description:
      "Batch processes bounded chunks on a schedule — simple, cheap, trivially reprocessable, at the cost of latency. Streaming processes unbounded events as they arrive, and hands you problems batch sidesteps: event-time vs processing-time (a phone that buffered offline uploads three hours late), exactly-once vs at-least-once delivery semantics, windowing, distributed state management, and reprocessing asymmetry (in batch you rerun the job; in streaming you're replaying from an offset against logic that may have changed since those events were emitted). The disciplined instinct: let the *decision* drive latency, not the data. If a human checks a dashboard once each morning, real-time freshness is 24/7 theater you pay for.",
    swe_analogy:
      "Sync vs async at the architectural level. Sync/async picks how you wait *within one execution*; batch vs streaming picks how data moves through the *entire system* — and what complexity and cost tax you take on in exchange for lower latency.",
    sort_order: 2,
  },
  {
    slug: "understanding-data-consumers",
    phase_slug: "thinking-in-data",
    title: "Understanding data consumers",
    description:
      "Your consumers are analysts writing SQL, BI dashboards, and ML feature pipelines — not API clients reading a documented contract. Analysts care intensely about *grain* (what does one row represent?) and *definitions* (what exactly counts as an \"active user\"? — and marketing's, finance's, and product's answers often disagree). ML pipelines have signature catastrophic failures of their own: **training/serving skew** (a feature computed one way in your batch SQL drifts from the version computed in production), and **point-in-time leakage** (a feature accidentally includes information from after the prediction point, so the model looks brilliant in eval and dies in prod). Consumers can rarely tell when data is wrong because they don't know what \"right\" looks like — the entire burden of correctness lands on you.",
    swe_analogy:
      "Like designing a public API — except your \"API\" is a data warehouse, consumers reach for tables instead of endpoints, and there's no compiler to catch their mistakes against your contract. They explore rather than integrate.",
    sort_order: 3,
  },
  {
    slug: "schemas-as-contracts",
    phase_slug: "thinking-in-data",
    title: "Schemas as contracts",
    description:
      "A published schema is a binding agreement with downstream consumers. The discipline is *compatibility direction* — backward (new code reads old data; safe when you add a nullable field), forward (old code reads new data; ignores fields it doesn't know), full (both). Schema registries like Confluent (for Avro/Protobuf) enforce these at write time so a producer literally cannot publish a breaking change. The killer isn't the structural break — those get caught. It's the *semantic* break: someone redefines `revenue` from gross to net, the column is still a float, every type check passes, every dashboard built on it is now wrong, and you find out weeks later when finance does a manual reconciliation. A grain change (one-row-per-order → one-row-per-line-item) is the same flavor of silent disaster.",
    swe_analogy:
      "Versioned REST APIs or protobuf definitions, but unlike code the data persists indefinitely — the schema has to keep validating against records produced months ago by older versions of the producer. Protobuf's \"never reuse a field number\" rule exists for exactly this reason.",
    sort_order: 4,
  },
  {
    slug: "failures-are-backlogs",
    phase_slug: "thinking-in-data",
    title: "The failure model is a backlog, not a retry",
    description:
      "A failed web request is isolated — the user retries, the world moves on. A failed pipeline at 3 AM blocks every downstream job that depends on it: you wake up to a backlog of stale dashboards plus the recovery problem of backfilling the gap without double-counting what partially succeeded. This is why DAGs, orchestrators (Airflow, Dagster, Prefect), and dependency-graph thinking are central to DE in a way they aren't to most app work. \"What happens when step 7 of 20 fails and steps 1–6 already wrote data?\" is a question you'll answer constantly.",
    swe_analogy:
      "Closer to a build dependency tree (Make, Bazel, npm task graphs) than to handling one HTTP request at a time. The data twist: the same DAG re-executes for each time partition, and runs can be backfilled — so failure recovery is multi-dimensional.",
    sort_order: 5,
  },
  {
    slug: "idempotency-as-mindset",
    phase_slug: "thinking-in-data",
    title: "Idempotency is a design axis, not a nice-to-have",
    description:
      "You *will* rerun pipelines — for backfills, bug fixes, late-arriving data, recovery from a transient cluster failure. So every transformation must be safe to run twice and produce the identical result. In practice: design around upserts on a stable key, deduplication on a natural key, deterministic logic (no `now()` baked into a row's content, no relying on processing order, no randomness without a seed). You stop thinking in events-that-append (an SWE habit) and start thinking in desired-end-states: the same final dataset regardless of how many times this runs. Phase 3 covers the implementation patterns; this is the mindset.",
    swe_analogy:
      "The same property you want from a PUT or DELETE endpoint, but elevated from an HTTP-method choice to the foundational design axis behind every transformation you write.",
    sort_order: 6,
  },
  {
    slug: "statistical-testing",
    phase_slug: "thinking-in-data",
    title: "Testing goes statistical",
    description:
      "You can't write `assertEqual(result, 42)` against live data that changes every day. Tests become assertions about *properties* of the dataset: this column is never null, this combination is unique, row count is within 10% of the trailing 7-day average, this categorical only takes these values, this number is non-negative, this distribution's mean hasn't jumped 3 sigma. And you can't fully reproduce production in a test environment — the bugs come from the shape and scale of *real* data: the one customer with a 10-megabyte order, the encoding that only appears in one region. So a chunk of \"testing\" is really continuous monitoring running against production itself (Great Expectations, dbt tests, Monte Carlo).",
    swe_analogy:
      "Property-based testing (QuickCheck, fast-check) plus production observability and alerting, merged into one discipline. You assert on shape and distribution, then watch in prod.",
    sort_order: 7,
  },
  {
    slug: "time-as-engineering-problem",
    phase_slug: "thinking-in-data",
    title: "Time and history are first-class problems",
    description:
      "Application databases are mutable and present-tense: \"what is this customer's address?\" returns the current value. Analytics constantly needs the *historical* truth: \"what was their address on the day of the order?\" That forces append-only/immutable designs and patterns like slowly-changing dimensions (SCD Type 2) — keep every version of a row with validity ranges instead of overwriting. Layered on that, you juggle three distinct notions of time at once — when an event happened (event time), when you ingested it (ingestion time), when you processed it (processing time) — and the \"correct answer\" depends on which one the question is about. Phase 5 covers the streaming-specific machinery (watermarks, windowing); this is the broader mindset.",
    swe_analogy:
      "Event sourcing applied to your whole dataset, but you also have to keep three clocks straight at once instead of pretending the network is ordered. Closest SWE pain point: clock skew in distributed tracing.",
    sort_order: 8,
  },
  {
    slug: "scale-and-cost-as-design-axes",
    phase_slug: "thinking-in-data",
    title: "Scale changes the algorithm; cost is a design axis",
    description:
      "A `GROUP BY` is free over a few thousand rows; over a billion rows it's a distributed shuffle that can run for an hour — or run out of memory entirely if the data is *skewed* (one key holding 90% of the rows). You start thinking about partitioning, clustering, data locality, and columnar file formats (Parquet, ORC) the way SWEs think about Big-O. Uniquely in DE, *cost is a primary design constraint*: cloud warehouses charge by bytes scanned, so a query that's merely \"correct\" can be financially ruinous at scale. Partition pruning, incremental models that touch only new data, and avoiding full-table rescans aren't optimizations you do later — they're part of getting the design right.",
    swe_analogy:
      "Big-O analysis, but with dollars and minutes as the cost units, not just complexity class. A correct-but-naive analytics query is the data equivalent of an O(n²) algorithm that also runs up your AWS bill.",
    sort_order: 9,
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
