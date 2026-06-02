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
  // ── Phase 1 ──────────────────────────────────────────
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "Why is 'data is the product' a meaningfully different mindset from typical backend engineering?",
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
      "In backend engineering the API response is the surface; the data behind it is incidental. In data engineering the dataset itself — its schema, freshness, correctness — is what downstream analysts and ML models depend on, so it's the actual product. And unlike an API, when the data is wrong nobody pages oncall — trust just quietly erodes.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "An e-commerce team's marketing lead reviews the previous day's sales dashboard each morning at 9 AM. Engineering is debating whether to make it real-time. What's the disciplined response?",
    options: [
      { id: "a", text: "Build the streaming pipeline; fresher data is always better.", correct: false },
      {
        id: "b",
        text: "Push back — the decision cadence (daily review) should drive the freshness target. A nightly batch is the right tool.",
        correct: true,
      },
      { id: "c", text: "Build both batch and streaming so the team can choose at runtime.", correct: false },
      { id: "d", text: "Build streaming, but only enable it during business hours.", correct: false },
    ],
    explanation:
      "Real-time is standing infrastructure (you pay for it 24/7) and brings hard problems batch sidesteps — late events, exactly-once semantics, windowing, distributed state. If a human only acts on the data once each morning, real-time freshness is theater. The instinct to internalize: latency should be driven by the decision, not the data.",
    sort_order: 2,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "An ML model trained against your feature `customer_lifetime_value` had 92% accuracy in offline eval but 60% in production. What's the most likely cause?",
    options: [
      { id: "a", text: "The model wasn't trained on enough data.", correct: false },
      {
        id: "b",
        text: "Training/serving skew — the feature was computed differently in the batch SQL than in the serving code path.",
        correct: true,
      },
      { id: "c", text: "Random variance; retrain and it'll be fine.", correct: false },
      { id: "d", text: "The model is overfit to the training set.", correct: false },
    ],
    explanation:
      "Training/serving skew is the canonical ML-vs-DE failure mode: the same feature drifts between how you computed it in the warehouse and how it's computed at request time in production. The model looked brilliant in eval and silently degraded once it hit prod. Feature stores (Feast, Tecton, SageMaker Feature Store) exist to guarantee a single computation path for both training and serving.",
    sort_order: 3,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "A producer adds a new optional, nullable column to a published table. What kind of schema change is this, conventionally?",
    options: [
      { id: "a", text: "Breaking — every consumer must redeploy.", correct: false },
      { id: "b", text: "Backward-compatible — existing consumers can ignore it.", correct: true },
      { id: "c", text: "Forbidden under any data contract.", correct: false },
      { id: "d", text: "Allowed only if all consumers approve in advance.", correct: false },
    ],
    explanation:
      "Adding a new nullable column is backward-compatible: existing consumers can ignore it, and old data still validates against the new schema. Schema registries (Confluent, AWS Glue) enforce compatibility direction at write time — backward, forward, or full — so the producer literally cannot publish an incompatible change.",
    sort_order: 4,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "Which schema change is most likely to silently corrupt downstream reports without raising any errors?",
    options: [
      { id: "a", text: "Renaming a column from `customer_id` to `cust_id`.", correct: false },
      { id: "b", text: "Changing a column's data type from int to float.", correct: false },
      {
        id: "c",
        text: "Redefining `revenue` from gross-of-tax to net-of-tax while keeping the same name and float type.",
        correct: true,
      },
      { id: "d", text: "Adding a new non-null column without a default.", correct: false },
    ],
    explanation:
      "The structural changes (rename, type change, missing default) typically break consumers or the schema registry rejects them. The killer is the *semantic* change: column name, type, and shape are unchanged, every type check passes, every downstream `SUM(revenue)` is now systematically wrong, and you find out weeks later when finance does a manual reconciliation. A grain change (one-row-per-order → one-row-per-line-item) is the same flavor of silent disaster.",
    sort_order: 5,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "A daily pipeline DAG has job D depending on jobs A, B, C (which run in parallel). Tuesday night, B fails. By Wednesday morning, what's most likely true?",
    options: [
      { id: "a", text: "A retry will silently fix it; just check today's run.", correct: false },
      {
        id: "b",
        text: "D didn't run, Tuesday's dashboards are stale, and you now have a backfill problem to resolve before today's run finishes.",
        correct: true,
      },
      { id: "c", text: "Only the dashboards consuming B's output are affected.", correct: false },
      { id: "d", text: "The orchestrator will automatically reorder the DAG to skip B.", correct: false },
    ],
    explanation:
      "Pipeline failures cascade through DAG dependencies. A failed upstream blocks every downstream that depends on it (D didn't run because B is missing), every dashboard in the chain is now stale, and recovery means backfilling Tuesday's gap *while* today's run is also queueing. This compounding failure shape is why DE leans on DAG orchestrators (Airflow, Dagster, Prefect) — request retries don't apply.",
    sort_order: 6,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "A pipeline transforms raw events into a daily summary table. The team needs to backfill 30 days because they fixed a bug. What design property makes this safe to do?",
    options: [
      { id: "a", text: "The pipeline runs on a schedule.", correct: false },
      {
        id: "b",
        text: "Each day's output is deterministic and the write replaces (not appends to) that day's partition.",
        correct: true,
      },
      { id: "c", text: "The pipeline retries on failure.", correct: false },
      { id: "d", text: "The team disables monitoring during the backfill.", correct: false },
    ],
    explanation:
      "Idempotency means a run produces the same end state regardless of how many times it executes. Per-partition replacement (delete+insert, MERGE, or partition swap) gives that property — backfills overwrite the bad partitions cleanly. Without it, a backfill appends and you double-count for 30 days. The SWE habit of \"insert when this happens\" inverts to \"make the end state correct regardless of how many times this runs.\"",
    sort_order: 7,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "Your daily revenue pipeline normally outputs ~50,000 rows. Today it outputs 48,200 rows and every validation test passes. What kind of test is most likely to catch an issue you'd otherwise miss?",
    options: [
      { id: "a", text: "A unit test asserting `revenue >= 0`.", correct: false },
      { id: "b", text: "A schema test asserting the columns exist.", correct: false },
      {
        id: "c",
        text: "A statistical test: row count is within X% of the trailing 7-day average.",
        correct: true,
      },
      { id: "d", text: "A type check on the `revenue` column.", correct: false },
    ],
    explanation:
      "The exact value (48,200) can't be asserted — it changes daily. Property checks like nullability and type pass on subtly wrong data. The distribution check — comparing today's volume to the recent rolling average — is what catches a silent dropoff (maybe an upstream filter changed and 4% of events are now dropped). Great Expectations and dbt's `accepted_range` / freshness tests automate this style of assertion.",
    sort_order: 8,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "A user's shipping address changed on March 1. They placed an order on February 15 (shipped to the old address) and another on March 10 (shipped to the new address). Your analytics question: \"where did this user ship orders to?\" What's required in the data model?",
    options: [
      { id: "a", text: "Just store the current address; analysts can ignore old data.", correct: false },
      {
        id: "b",
        text: "Slowly-Changing-Dimension (SCD) Type 2 — keep both address versions with validity ranges so the historical truth survives.",
        correct: true,
      },
      { id: "c", text: "Always recompute orders against the current address.", correct: false },
      { id: "d", text: "Just put a timestamp on the orders.", correct: false },
    ],
    explanation:
      "Application databases overwrite (the address column has the new value, period). Analytics needs the *historical* truth — which address was in effect when each order shipped? SCD Type 2 keeps every version of a dimension row with `valid_from` / `valid_to` so joining the order to the address as-of the order date returns the correct historical answer. The broader habit: time and history are first-class problems in DE.",
    sort_order: 9,
  },
  {
    checkpoint_slug: "checkpoint-thinking-in-data",
    prompt:
      "A BigQuery query scans 8 TB and costs $40. The team partitions the underlying table by `event_date` and rewrites the query to filter `where event_date = '2026-05-28'`. The same query now scans 110 GB and costs $0.55. Why?",
    options: [
      { id: "a", text: "BigQuery applied a free tier.", correct: false },
      {
        id: "b",
        text: "Partition pruning — the planner skipped partitions that can't match the filter, so only one day's files were scanned.",
        correct: true,
      },
      { id: "c", text: "BigQuery cached the result of the previous run.", correct: false },
      { id: "d", text: "The team upgraded their billing plan.", correct: false },
    ],
    explanation:
      "Partitioning splits a table into separate physical files keyed by a column (here, `event_date`). When the query's WHERE clause filters on the partition key, the engine prunes (skips entirely) every partition that can't match the filter — turning a full-table scan into a one-partition scan. At scale this is the difference between $40 and $0.55 per query. Partition pruning, columnar formats (Parquet), and incremental models are correctness-adjacent — not optional optimizations.",
    sort_order: 10,
  },

  // ── Phase 2 ──────────────────────────────────────────
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "Why is denormalizing a warehouse fact table safe in ways it would be dangerous in an OLTP system?",
    options: [
      { id: "a", text: "Warehouses don't enforce constraints, so duplication doesn't matter.", correct: false },
      {
        id: "b",
        text: "Analytical data is largely append-only — you're recording history, not maintaining current state — so the update anomalies DRY exists to prevent don't apply.",
        correct: true,
      },
      { id: "c", text: "Disk is cheaper in warehouses than in OLTP databases.", correct: false },
      { id: "d", text: "Columnar storage automatically deduplicates rows.", correct: false },
    ],
    explanation:
      "DRY's whole payoff is avoiding update anomalies — inconsistencies that arise when duplicated mutable data drifts. Analytical fact tables are immutable history: you rarely update a past order, and you often *want* the customer's city frozen as it was at order time. Denormalization aligns with that immutability — the redundancy that would corrupt an OLTP system is harmless here.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "You're designing a fact table for an e-commerce business. In a dimensional model, which of these should be a **fact** and which should be a **dimension**?",
    options: [
      { id: "a", text: "`order_revenue` is a dimension; `customer_segment` is a fact.", correct: false },
      {
        id: "b",
        text: "`order_revenue` is a fact (measurable event-level value); `customer_segment` is a dimension (descriptive context).",
        correct: true,
      },
      { id: "c", text: "Both should be facts.", correct: false },
      { id: "d", text: "Both should be dimensions.", correct: false },
    ],
    explanation:
      "Facts are the verbs — measurable, additive, event-level values you'll sum or average (revenue, quantity, duration). Dimensions are the nouns and adjectives that describe a fact — who, what, where, when, why (customer segment, product category, store, date). The Kimball grammar: SUM(facts) GROUP BY dimensions.",
    sort_order: 2,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "An analyst aggregates a fact table assuming one row per order, but the table is actually one row per *line item* (multiple lines per order). What goes wrong?",
    options: [
      { id: "a", text: "Nothing — the SUM just adds them up correctly.", correct: false },
      {
        id: "b",
        text: "`COUNT(*)` and any `SUM(revenue)` are inflated by the average lines-per-order multiplier. Every dashboard built on it is silently wrong.",
        correct: true,
      },
      { id: "c", text: "The query crashes because of a schema mismatch.", correct: false },
      { id: "d", text: "Only the row count is wrong; revenue is fine.", correct: false },
    ],
    explanation:
      "Mistaking the grain is the canonical dimensional-modeling failure. \"One row per order\" vs \"one row per line item\" multiplies your counts and your revenue by the average lines-per-order — and nothing errors, because the data is structurally fine. The defense: write the grain as a single sentence at the top of every fact-table definition, and assert uniqueness on the grain's natural key.",
    sort_order: 3,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "A customer's billing address changed last month. Reporting needs to show *historical* orders shipped to the old address but *new* orders going to the new one. What SCD strategy does this require?",
    options: [
      { id: "a", text: "SCD Type 1 — overwrite the old address.", correct: false },
      {
        id: "b",
        text: "SCD Type 2 — expire the old dimension row, insert a new version with validity ranges, and tie fact rows to the version that was current when the event happened.",
        correct: true,
      },
      { id: "c", text: "Just store a timestamp on each order.", correct: false },
      { id: "d", text: "Recompute all reports against the current address.", correct: false },
    ],
    explanation:
      "Type 1 (overwrite) loses history — Old orders would appear to ship to the new address. Type 2 keeps every version of the dimension with `valid_from` / `valid_to`, and each fact row references the surrogate key of the version that was current at the order date. That's how analytical models achieve point-in-time correctness — the same way git keeps every commit, not just HEAD.",
    sort_order: 4,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "Which mapping correctly translates a git concept to the equivalent SCD Type 2 concept?",
    options: [
      { id: "a", text: "Commit hash → primary key of the dimension table.", correct: false },
      { id: "b", text: "Commit hash → surrogate key of the dimension version.", correct: true },
      { id: "c", text: "Commit hash → the fact table's `order_id`.", correct: false },
      { id: "d", text: "Commit hash → `is_current` flag.", correct: false },
    ],
    explanation:
      "Each new version of a dimension row gets a new surrogate key, exactly like each commit gets a new hash. The natural key (customer_id) stays the same — that's the file path. `valid_from` / `valid_to` are commit timestamps. `is_current = true` is HEAD. The surrogate key is what fact rows reference to pin themselves to a point-in-time version.",
    sort_order: 5,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "A query reads two columns from a 1-billion-row table. Why does columnar storage outperform row storage by orders of magnitude on this workload?",
    options: [
      { id: "a", text: "Columnar storage compresses the data, so total size is smaller.", correct: false },
      {
        id: "b",
        text: "It reads only those two columns from disk instead of every row's full set of fields, the homogeneous column compresses dramatically, AND it's perfect for vectorized/SIMD execution. Three compounding wins.",
        correct: true,
      },
      { id: "c", text: "Columnar storage skips rows that don't match the WHERE clause.", correct: false },
      { id: "d", text: "Columnar databases run queries in parallel.", correct: false },
    ],
    explanation:
      "Three reasons stack: (1) you read only the two columns you need, not every column of every row; (2) a single column is homogeneous, often low-cardinality and sorted, so it compresses dramatically (run-length, dictionary); (3) a contiguous column is perfect for vectorized/SIMD execution. The same idea as restructuring a hot loop from array-of-structs to struct-of-arrays in systems code.",
    sort_order: 6,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "In a medallion architecture, you discover a bug in your silver-layer deduplication logic that's been running for a month. What's the recovery path?",
    options: [
      { id: "a", text: "Run UPDATE statements against the affected silver rows.", correct: false },
      {
        id: "b",
        text: "Fix the silver-layer code, then rebuild silver and gold from the immutable bronze layer for the affected period.",
        correct: true,
      },
      { id: "c", text: "Re-ingest the source data from the API.", correct: false },
      { id: "d", text: "Manually patch the gold-layer dashboards.", correct: false },
    ],
    explanation:
      "The whole point of keeping bronze immutable and append-only is that silver and gold are *reprocessable* — they're derived layers. Fix the silver code, drop and rebuild silver (and gold) for the affected window from bronze. This is the same layered-architecture payoff as in software: isolated blast radius, clear contracts between stages, recovery without going back to the source system.",
    sort_order: 7,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "An enterprise warehouse needs to integrate 20+ source systems, must preserve every historical change for audit, and expects new source systems to be added regularly without disrupting the existing model. Which methodology is purpose-built for this?",
    options: [
      { id: "a", text: "Highly normalized 3NF.", correct: false },
      { id: "b", text: "Star schema with conformed dimensions.", correct: false },
      {
        id: "c",
        text: "Data Vault — hubs (stable business keys), links (relationships), satellites (timestamped attribute history); insert-only and resilient to source change.",
        correct: true,
      },
      { id: "d", text: "Single denormalized wide table.", correct: false },
    ],
    explanation:
      "Data Vault is specifically designed for integration, auditability, and resilience to source change. Hubs hold stable business keys, links capture relationships, satellites are append-only attribute history. Bolting on a new source or attribute doesn't require restructuring the existing model. Dimensional/star is for *consumption* — Vault often sits underneath as the integration layer with star schemas built on top.",
    sort_order: 8,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "What does *grain* mean in dimensional modeling, and why is it called the most important decision?",
    options: [
      { id: "a", text: "The total size of the fact table; bigger grain = more rows.", correct: false },
      {
        id: "b",
        text: "Exactly what one row in the fact table represents (e.g. \"one line item per order per day\"). Picking it wrong silently corrupts every aggregation built on the table.",
        correct: true,
      },
      { id: "c", text: "How fine-grained the partitioning key is.", correct: false },
      { id: "d", text: "The number of dimensions attached to the fact.", correct: false },
    ],
    explanation:
      "Grain is the contract for the fact table — the precise unit of analysis. Get it wrong and double-counting (or under-counting) creeps in everywhere; queries assume one shape and get another. The discipline is to write the grain as a single sentence at the top of every fact-table definition, before adding any columns, and assert uniqueness on the natural key for that grain.",
    sort_order: 9,
  },
  {
    checkpoint_slug: "checkpoint-data-modeling-fundamentals",
    prompt: "Which of these statements about denormalization in an OLAP warehouse is correct?",
    options: [
      { id: "a", text: "It's a violation of best practice; modern warehouses don't need it.", correct: false },
      { id: "b", text: "It's required by columnar storage engines.", correct: false },
      {
        id: "c",
        text: "It trades storage for query speed, and the redundancy is safe because the data is largely append-only (no update anomalies). Columnar compression also makes the duplicated values nearly free to store.",
        correct: true,
      },
      { id: "d", text: "It's only useful for tables under 1 million rows.", correct: false },
    ],
    explanation:
      "Denormalization in analytics is a deliberate, well-grounded trade: more storage in exchange for fewer joins at scan time. It works because (a) the data is immutable history so update anomalies don't apply, and (b) columnar engines compress repeated values dramatically — the city \"Providence\" repeated across a million rows occupies almost nothing. The cost is genuinely small; the read-speed payoff is huge.",
    sort_order: 10,
  },

  // ── Phase 3 ──────────────────────────────────────────
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

  // ── Phase 4 ──────────────────────────────────────────
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

  // ── Phase 5 ──────────────────────────────────────────
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

  // ── Phase 6 ──────────────────────────────────────────
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

  // ── Phase 7 ──────────────────────────────────────────
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
