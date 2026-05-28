export type CheckpointSeed = {
  slug: string;
  phase_slug: string;
  title: string;
  description: string;
  pass_score: number;
  sort_order: number;
};

export type QuestionOption = { id: string; text: string; correct: boolean };

export type QuestionSeed = {
  checkpoint_slug: string;
  prompt: string;
  options: QuestionOption[];
  explanation: string;
  sort_order: number;
};

export const checkpoints: CheckpointSeed[] = [
  {
    slug: "checkpoint-thinking-in-data",
    phase_slug: "thinking-in-data",
    title: "Phase 1 checkpoint",
    description: "Confirm the data-as-product mindset before moving on.",
    pass_score: 70,
    sort_order: 1,
  },
  {
    slug: "checkpoint-data-modeling-fundamentals",
    phase_slug: "data-modeling-fundamentals",
    title: "Phase 2 checkpoint",
    description: "Make sure you can pick the right modeling shape for a workload.",
    pass_score: 70,
    sort_order: 2,
  },
  {
    slug: "checkpoint-data-movement-and-transformation",
    phase_slug: "data-movement-and-transformation",
    title: "Phase 3 checkpoint",
    description: "Idempotency and ELT trade-offs.",
    pass_score: 70,
    sort_order: 3,
  },
  {
    slug: "checkpoint-pipeline-orchestration-and-reliability",
    phase_slug: "pipeline-orchestration-and-reliability",
    title: "Phase 4 checkpoint",
    description: "DAGs, dependencies, and recovering from bad runs.",
    pass_score: 70,
    sort_order: 4,
  },
  {
    slug: "checkpoint-streaming-and-event-driven-data",
    phase_slug: "streaming-and-event-driven-data",
    title: "Phase 5 checkpoint",
    description: "Event time, late arrivals, and the log model.",
    pass_score: 70,
    sort_order: 5,
  },
  {
    slug: "checkpoint-storage-scale-and-compute",
    phase_slug: "storage-scale-and-compute",
    title: "Phase 6 checkpoint",
    description: "Physical storage layout and query pruning.",
    pass_score: 70,
    sort_order: 6,
  },
  {
    slug: "checkpoint-data-platform-thinking",
    phase_slug: "data-platform-thinking",
    title: "Phase 7 checkpoint",
    description: "Contracts and observability as platform primitives.",
    pass_score: 70,
    sort_order: 7,
  },
];

export const questions: QuestionSeed[] = [
  // Phase 1
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt: "Why is 'data is the product' a meaningfully different mindset from typical backend engineering?",
    options: [
      { id: "a", text: "Because data engineers don't write code.", correct: false },
      {
        id: "b",
        text: "Because the dataset's shape, freshness, and correctness are the deliverable — not just the code that produces it.",
        correct: true,
      },
      { id: "c", text: "Because data engineers never deploy.", correct: false },
      { id: "d", text: "Because data engineers only write SQL.", correct: false },
    ],
    explanation:
      "In backend engineering the API response is the surface; the data behind it is incidental. In data engineering the dataset itself — its schema, freshness, correctness — is what downstream analysts and ML models depend on, so it's the actual product.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt: "A producer adds a new optional, nullable column to a published table. What kind of schema change is this, conventionally?",
    options: [
      { id: "a", text: "Breaking — every consumer must redeploy.", correct: false },
      { id: "b", text: "Backward-compatible — existing consumers can ignore it.", correct: true },
      { id: "c", text: "Forbidden under any data contract.", correct: false },
      { id: "d", text: "Allowed only if all consumers approve in advance.", correct: false },
    ],
    explanation:
      "Adding a new nullable column is backward-compatible: existing consumers can ignore it, and old data still validates against the new schema. Dropping a column or changing a type would be breaking.",
    sort_order: 2,
  },

  // Phase 2
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "A dashboard aggregates millions of rows across 6 normalized tables to compute a daily KPI. It's slow. What's the typical first move?",
    options: [
      { id: "a", text: "Add more indexes to the source tables.", correct: false },
      {
        id: "b",
        text: "Move to a column-oriented (OLAP) store and denormalize the metrics into a fact table.",
        correct: true,
      },
      { id: "c", text: "Cache the dashboard result in Redis.", correct: false },
      { id: "d", text: "Switch to row-oriented storage.", correct: false },
    ],
    explanation:
      "For scan-heavy analytics, denormalize into a fact table in a column-oriented store. Joins at scan time over millions of rows are the bottleneck; pre-computing them into wide rows trades storage for query latency.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "Which workload is OLTP better suited for than OLAP?",
    options: [
      { id: "a", text: "Computing the 90-day moving average of sales across all stores.", correct: false },
      { id: "b", text: "Fetching a single customer's open shopping cart by user_id.", correct: true },
      { id: "c", text: "Aggregating clickstream events by hour.", correct: false },
      { id: "d", text: "Re-deriving year-over-year revenue per region.", correct: false },
    ],
    explanation:
      "OLTP excels at point lookups and small read/write transactions — fetching, updating, deleting individual rows by primary key. OLAP excels at wide aggregations over many rows but few columns.",
    sort_order: 2,
  },

  // Phase 3
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "A pipeline is rerun for the same partition due to an upstream fix. Without idempotency, what's the most likely failure mode?",
    options: [
      { id: "a", text: "The job refuses to start.", correct: false },
      { id: "b", text: "Duplicate rows in the target table.", correct: true },
      { id: "c", text: "The schema changes automatically.", correct: false },
      { id: "d", text: "The cluster crashes.", correct: false },
    ],
    explanation:
      "A non-idempotent pipeline appends rows on each run. Re-running it (even for legitimate reasons like backfills or retries) duplicates everything in that partition. Idempotency is achieved by merge-on-key writes, deterministic partition replacement, or transactional swaps.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "What distinguishes ELT from ETL?",
    options: [
      { id: "a", text: "ELT never transforms data.", correct: false },
      { id: "b", text: "ELT loads raw data first, then transforms it inside the warehouse.", correct: true },
      { id: "c", text: "ETL is always faster than ELT.", correct: false },
      { id: "d", text: "ELT doesn't require a warehouse.", correct: false },
    ],
    explanation:
      "ELT pushes transformation compute into the warehouse. Raw data lands first, then transformations re-derive curated tables — cheaply, repeatably, and easy to iterate on because the raw layer is always available.",
    sort_order: 2,
  },

  // Phase 4
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "You discover last week's daily pipeline had a filter bug. Seven days of customer counts are wrong. What's the standard recovery?",
    options: [
      { id: "a", text: "Manually UPDATE the bad rows in the warehouse.", correct: false },
      {
        id: "b",
        text: "Fix the code, then backfill the pipeline for the affected 7-day window.",
        correct: true,
      },
      { id: "c", text: "Truncate the table and rebuild it from scratch.", correct: false },
      { id: "d", text: "Issue a correction note and leave the data alone.", correct: false },
    ],
    explanation:
      "Backfilling means re-running the pipeline against the affected partitions with the corrected logic. This is the standard recovery and depends on the pipeline being idempotent — re-running it overwrites the bad partitions cleanly.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "In a DAG, task C depends on both A and B. What does the scheduler guarantee?",
    options: [
      { id: "a", text: "A, B, and C all run in parallel.", correct: false },
      { id: "b", text: "C will not start until both A and B have completed successfully.", correct: true },
      { id: "c", text: "A always runs before B.", correct: false },
      { id: "d", text: "If C fails, A and B will be retried.", correct: false },
    ],
    explanation:
      "A DAG's edges express dependencies. A successor task starts only after all its predecessors complete successfully. Independent siblings (A and B here) can run in parallel — that's a major reason DAGs are useful.",
    sort_order: 2,
  },

  // Phase 5
  {
    checkpoint_slug: "checkpoint-streaming-and-event-driven-data",
    prompt: "An IoT device has a wrong clock and emits events timestamped 'yesterday'. Your stream pipeline aggregates per-hour metrics by event time. What happens?",
    options: [
      { id: "a", text: "The events are silently dropped.", correct: false },
      {
        id: "b",
        text: "The events update yesterday's hourly buckets — they're late-arriving data.",
        correct: true,
      },
      { id: "c", text: "The pipeline crashes.", correct: false },
      { id: "d", text: "The events get reassigned to today's window.", correct: false },
    ],
    explanation:
      "Event-time stream processing groups events by when they happened, not when they arrived, so late events update historical windows. Production systems use watermarks to bound how long a window stays open before it's considered final.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-streaming-and-event-driven-data",
    prompt: "Why are streaming systems usually built around an append-only log instead of a mutable queue?",
    options: [
      { id: "a", text: "Append-only logs are cheaper to store.", correct: false },
      {
        id: "b",
        text: "Multiple consumers can replay independently from any offset.",
        correct: true,
      },
      { id: "c", text: "Append-only logs don't need ordering guarantees.", correct: false },
      { id: "d", text: "Mutable queues can't handle high throughput.", correct: false },
    ],
    explanation:
      "A traditional queue deletes messages when they're consumed. An append-only log keeps history, so each consumer tracks its own offset and can replay from any point — essential for adding new consumers, recovering from bugs, and bootstrapping new analytical views.",
    sort_order: 2,
  },

  // Phase 6
  {
    checkpoint_slug: "checkpoint-storage-scale-and-compute",
    prompt: "A query reads two columns from a 1-billion-row table stored in row format. Roughly how much data must the engine scan?",
    options: [
      { id: "a", text: "Only the bytes of the two requested columns.", correct: false },
      { id: "b", text: "The whole table — every column of every row.", correct: true },
      { id: "c", text: "Only the column metadata.", correct: false },
      { id: "d", text: "A random sample of rows.", correct: false },
    ],
    explanation:
      "Row format stores all columns of a row contiguously, so reading two columns from every row still requires reading past every other column on disk. Columnar formats store each column as its own file, so a 2-column read only touches those two columns' data.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-storage-scale-and-compute",
    prompt: "A table is partitioned by event_date. Queries filter `where event_date between '2025-01-01' and '2025-01-07'`. What does the engine do?",
    options: [
      { id: "a", text: "Read the whole table and apply the filter afterward.", correct: false },
      { id: "b", text: "Read only the 7 partitions corresponding to those dates.", correct: true },
      { id: "c", text: "Read all partitions but ignore the filter.", correct: false },
      { id: "d", text: "Materialize a new table for the date range.", correct: false },
    ],
    explanation:
      "Partitioning lets the query planner prune partitions that can't match the filter. A 7-day scan against 2 years of data touches ~1% of the storage. The partition key has to align with how queries actually filter, or partitioning achieves nothing.",
    sort_order: 2,
  },

  // Phase 7
  {
    checkpoint_slug: "checkpoint-data-platform-thinking",
    prompt: "A producer team renames customer_id to cust_id and pushes the change. Three downstream dashboards break immediately. What was missing?",
    options: [
      { id: "a", text: "A unit test in the producer's code.", correct: false },
      {
        id: "b",
        text: "A data contract with versioning and a deprecation window.",
        correct: true,
      },
      { id: "c", text: "Better dashboard caching.", correct: false },
      { id: "d", text: "Stronger typing in the warehouse.", correct: false },
    ],
    explanation:
      "A data contract formalizes the producer-consumer agreement: what columns exist, what changes are allowed, and what notice consumers get. A rename under a contract would either be rejected or trigger a coordinated migration with a deprecation period. Without a contract, every change risks silent breakage.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-data-platform-thinking",
    prompt: "Which set is most representative of data observability signals?",
    options: [
      { id: "a", text: "Freshness, row counts, null rates, and lineage.", correct: true },
      { id: "b", text: "Code coverage of the transformation SQL.", correct: false },
      { id: "c", text: "Database CPU usage alone.", correct: false },
      { id: "d", text: "Number of dashboards built on the data.", correct: false },
    ],
    explanation:
      "Data observability covers the dataset's health: is it fresh, did the expected number of rows arrive, are values within expected distributions, and which upstream tables fed which downstream tables. It's the data analog of metrics/traces/logs in distributed systems.",
    sort_order: 2,
  },
];
