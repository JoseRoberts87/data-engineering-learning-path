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
    prompt: "Why did the industry shift from ETL to ELT for cloud-native data platforms?",
    options: [
      { id: "a", text: "ETL is harder to write than ELT.", correct: false },
      {
        id: "b",
        text: "Cloud warehouses decoupled storage from compute and made both cheap and elastic — landing raw became affordable, and warehouse compute became powerful enough to transform in place.",
        correct: true,
      },
      { id: "c", text: "ELT is faster than ETL by definition.", correct: false },
      { id: "d", text: "ETL was deprecated by SQL standards committees.", correct: false },
    ],
    explanation:
      "The shift is structural, not stylistic. Snowflake, BigQuery, and similar warehouses separated storage from compute and made each cheap. That made it affordable to land all the raw data first, and gave you elastic compute to transform in place — eliminating the need for a separate ETL tier. The big bonus: you keep the raw source of truth (bronze), so you can re-derive curated tables whenever logic changes.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "When does ETL (transform-before-load) still beat ELT?",
    options: [
      { id: "a", text: "When the source dataset is small.", correct: false },
      {
        id: "b",
        text: "When you must mask or drop PII before it lands in the warehouse (compliance), or when a transform is too heavy/procedural to express well in SQL.",
        correct: true,
      },
      { id: "c", text: "When your warehouse doesn't support partitioning.", correct: false },
      { id: "d", text: "When the source system is Postgres.", correct: false },
    ],
    explanation:
      "ELT is the modern default for most analytical workloads, but there are still good reasons to transform before loading. The dominant ones: compliance/PII (you can't land sensitive fields raw if regulation forbids it), and heavy procedural logic that SQL can't express cleanly (parsing, ML feature engineering, external API calls). For those cases, transform in Spark/Python first, then land the cleaned result.",
    sort_order: 2,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "A daily pipeline appends rows to a fact table. The team reruns yesterday's job to fix a bug. What happens?",
    options: [
      { id: "a", text: "Nothing — reruns just overwrite the rows.", correct: false },
      {
        id: "b",
        text: "Yesterday's rows are now duplicated. Every `SUM(revenue)` for that day is doubled. No error is thrown.",
        correct: true,
      },
      { id: "c", text: "The pipeline errors because the rows already exist.", correct: false },
      { id: "d", text: "The orchestrator detects the duplicate and skips the second run.", correct: false },
    ],
    explanation:
      "A non-idempotent pipeline silently corrupts on every rerun. The fix is `MERGE` on a stable business key, or partition overwrite (`DELETE WHERE date = X; INSERT`) so a second run replaces the partition rather than appending to it. \"Exactly-once\" is at-least-once delivery plus idempotent writes; idempotency is what makes unreliable execution safe.",
    sort_order: 3,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "What does \"exactly-once delivery\" really mean in a modern pipeline?",
    options: [
      { id: "a", text: "The message broker guarantees each event is delivered exactly once.", correct: false },
      {
        id: "b",
        text: "It's mostly a marketing term — what you actually build is at-least-once delivery plus idempotent writes, which yields effectively-once.",
        correct: true,
      },
      { id: "c", text: "Each message has a unique ID that lets you tell duplicates apart.", correct: false },
      { id: "d", text: "Strict ordering guarantees prevent duplicates.", correct: false },
    ],
    explanation:
      "True exactly-once is essentially impossible in distributed systems — the two-generals problem. What's practical is at-least-once delivery (the broker may deliver duplicates under failure) plus idempotent consumers (the same message processed twice produces the same end state). Together, the effect is exactly-once. Idempotency is the property that makes unreliable delivery safe.",
    sort_order: 4,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "Your incremental load uses `WHERE updated_at > :watermark` to pull new rows from a source table. After a month, the incremental copy has silently diverged from the source. What's the most likely cause?",
    options: [
      { id: "a", text: "The warehouse compressed the data.", correct: false },
      {
        id: "b",
        text: "Rows have been deleted from the source. A `WHERE updated_at > :watermark` query never sees deletes — there's no `updated_at` greater than the watermark for a row that no longer exists.",
        correct: true,
      },
      { id: "c", text: "The watermark column is the wrong type.", correct: false },
      { id: "d", text: "Updates always carry the same timestamp.", correct: false },
    ],
    explanation:
      "Naive timestamp-based incremental loads catch inserts and most updates, but miss two things: hard deletes (deleted rows are simply gone — no row has an `updated_at` to scan past the watermark) and late updates whose `updated_at` falls behind the watermark for some reason. The defenses: periodic full-reload reconciliation to heal drift, or Change Data Capture (CDC) reading the source's write-ahead log.",
    sort_order: 5,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "Why does Change Data Capture (CDC) catch source-data changes that naive watermark-based incremental loads miss?",
    options: [
      { id: "a", text: "CDC runs more frequently than batch incremental loads.", correct: false },
      {
        id: "b",
        text: "CDC reads the source database's write-ahead log directly, so it sees every insert, update, and delete the database commits — including changes that a `WHERE updated_at > :watermark` query can't observe.",
        correct: true,
      },
      { id: "c", text: "CDC keeps a backup of the source table for comparison.", correct: false },
      { id: "d", text: "CDC uses machine learning to predict changes.", correct: false },
    ],
    explanation:
      "CDC subscribes to the database's own replication stream (Postgres WAL, MySQL binlog, MongoDB oplog) — the same stream the database uses to keep replicas in sync. Every commit, including deletes and updates that don't bump a timestamp column, is captured as an event. Tools: Debezium (open-source), Fivetran/Airbyte (managed), AWS DMS, Snowflake streams. The cost is architectural — the source DBA has to enable replication — but it's the gold standard for incremental.",
    sort_order: 6,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "What's the conceptual inversion between software testing and data quality testing?",
    options: [
      { id: "a", text: "Data tests run faster than unit tests.", correct: false },
      {
        id: "b",
        text: "In SWE the code is the variable and test data is held constant. In DE the transform code is often stable while the data changes every run — the data itself is the variable being tested.",
        correct: true,
      },
      { id: "c", text: "Software tests check correctness; data tests check performance.", correct: false },
      { id: "d", text: "There's no real difference — they're the same discipline.", correct: false },
    ],
    explanation:
      "In software you assert that your code produces specific outputs from specific inputs. In data engineering you assert properties of the data flowing through — not-null, uniqueness, referential integrity, row counts within bounds, distribution shape — and you check them on every run, against production data. It's property-based testing merged with production observability. Tools like dbt tests, Great Expectations, and Soda specialize in this.",
    sort_order: 7,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "A row arrives in the silver layer that fails a not-null assertion on a required field. What's the dead-letter-queue (DLQ) pattern's response?",
    options: [
      { id: "a", text: "Fail the entire pipeline run; halt downstream.", correct: false },
      {
        id: "b",
        text: "Route the bad row to a quarantine (DLQ) side table and let the rest of the rows continue. Alert on the quarantine's depth so someone investigates.",
        correct: true,
      },
      { id: "c", text: "Silently drop the row.", correct: false },
      { id: "d", text: "Patch the row's missing field with a default value.", correct: false },
    ],
    explanation:
      "The DLQ pattern from messaging systems applied to data. Don't drop the bad row (you lose evidence) and don't fail the pipeline (you block all the good rows). Park the bad row in a quarantine table; alert on the depth. Combined with a circuit breaker at the silver→gold boundary, you keep good data flowing to consumers while preserving bad rows for inspection. (For critical data — e.g., financial transactions — you still fail loudly.)",
    sort_order: 8,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "Your team uses dbt with a layered DAG: staging → intermediate → mart. The Salesforce source changes a column name. Where does the ripple stop?",
    options: [
      { id: "a", text: "All downstream models break and need updating.", correct: false },
      {
        id: "b",
        text: "At the single staging model that touches the Salesforce source. Business logic in intermediate and mart models is untouched.",
        correct: true,
      },
      { id: "c", text: "At the orchestrator, which detects schema drift automatically.", correct: false },
      { id: "d", text: "Nowhere — the change propagates everywhere.", correct: false },
    ],
    explanation:
      "Staging models sit one-to-one with sources and are the *only* place that knows a source's quirks. When the source schema changes, you update the staging model to handle the rename, and downstream business logic doesn't need to change. This is the adapter pattern + dependency inversion applied to data: volatile source-specific code lives at the edges; stable business logic lives in the core.",
    sort_order: 9,
  },
  {
    checkpoint_slug: "checkpoint-data-movement-and-transformation",
    prompt: "When should you drop from declarative SQL transforms (dbt) to imperative code (Python/Spark)?",
    options: [
      { id: "a", text: "Whenever the team has Python experience.", correct: false },
      {
        id: "b",
        text: "When the work needs control SQL can't express well — complex procedural logic, ML feature engineering, unstructured data parsing, external API calls.",
        correct: true,
      },
      { id: "c", text: "When working with more than 100M rows.", correct: false },
      { id: "d", text: "Always — SQL is too limited for modern pipelines.", correct: false },
    ],
    explanation:
      "Prefer declarative SQL when the work fits — it's warehouse-native, version-controlled like code, accessible to analysts, and excellent for set-based relational work (joins, aggregations, window functions — the 80% case). Drop to imperative code when you need control declarative can't express. Real stacks freely mix both — Spark for heavy procedural ingestion, dbt SQL for the warehouse modeling layer. Same judgment as SQL-vs-hand-rolled or config-vs-code.",
    sort_order: 10,
  },

  // ── Phase 4 ──────────────────────────────────────────
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "What does the orchestrator (Airflow, Dagster, Prefect) actually do, in one line?",
    options: [
      { id: "a", text: "It moves and transforms the data.", correct: false },
      {
        id: "b",
        text: "It's the *control plane* — it decides what runs, in what order, when, what happens on failure, and whether the promises held. The data movement and transformation happens in the pipelines (the *data plane*).",
        correct: true,
      },
      { id: "c", text: "It runs queries on the warehouse.", correct: false },
      { id: "d", text: "It replaces dbt for transformations.", correct: false },
    ],
    explanation:
      "Orchestrators are control planes: a build system + job scheduler + incident-response system fused into one. They don't move bytes — they coordinate the system of pipelines that do. Once you internalize the split (control plane / data plane), the rest of the phase (dependency management, retries, backfills, SLAs) is just the responsibilities of the control plane.",
    sort_order: 1,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "Which orchestrator model has the DAG *inferred* from the assets and their inputs, rather than wired explicitly task-by-task?",
    options: [
      { id: "a", text: "Task-centric (Airflow's default model).", correct: false },
      {
        id: "b",
        text: "Asset-centric (Dagster, dbt via `ref()`). The lineage graph emerges from declaring data assets and their inputs, the same way a build system infers the dependency tree from `import` statements.",
        correct: true,
      },
      { id: "c", text: "Cron-style scheduling.", correct: false },
      { id: "d", text: "Both are equally hand-wired.", correct: false },
    ],
    explanation:
      "Task-centric orchestration (Airflow's original model) makes you wire `task_a >> task_b` explicitly. Asset-centric orchestration (Dagster, dbt) makes you declare \"this asset is built from these inputs,\" and the framework infers the DAG. Inferred graphs can't drift out of sync with the code — that's the win. dbt's `ref()` is exactly this pattern for the warehouse modeling layer.",
    sort_order: 2,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "What makes data DAG dependency management harder than build-system dependency management?",
    options: [
      { id: "a", text: "Nothing — they're the same problem.", correct: false },
      {
        id: "b",
        text: "Data dependencies are time-partitioned (\"A's *data for 2026-06-01* is ready before B processes 2026-06-01\"), and dependencies often reach outside the graph (vendor files, external datasets) — handled by sensors.",
        correct: true,
      },
      { id: "c", text: "Data graphs have cycles; build graphs don't.", correct: false },
      { id: "d", text: "Data graphs use a different algorithm than topological sort.", correct: false },
    ],
    explanation:
      "Topological sort works the same in both worlds. The data twists are (1) the dependency is per-partition, not just per-task — \"A's data for *this date* is ready before B processes *that date*\" — and (2) dependencies reach external systems (a vendor file, a dataset owned by another team), handled with sensors that block until the external thing exists.",
    sort_order: 3,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "Task A fails. Task B depends on A's output. What should the orchestrator do with B?",
    options: [
      { id: "a", text: "Run B anyway with whatever output A produced — keep the pipeline moving.", correct: false },
      {
        id: "b",
        text: "Mark B as blocked (Airflow's `upstream_failed`) and do *not* run it. Better to be late with correct data than fast with broken data.",
        correct: true,
      },
      { id: "c", text: "Retry A automatically forever.", correct: false },
      { id: "d", text: "Skip A and continue.", correct: false },
    ],
    explanation:
      "Failure propagation is the operational form of \"wrong is worse than late.\" If B runs on A's partial or missing output, the downstream report ends up subtly wrong — and that's worse than a delayed but correct one. This is what separates an orchestrator from a pile of cron jobs (which fire B at its scheduled minute regardless of whether A succeeded).",
    sort_order: 4,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "A transform uses `SELECT … , CURRENT_DATE - created_at AS days_since_created FROM …`. You backfill March 2024. What goes wrong?",
    options: [
      { id: "a", text: "Nothing — the calculation is straightforward.", correct: false },
      {
        id: "b",
        text: "`CURRENT_DATE` is today, not the partition's logical date. The backfilled March rows get \"days since created\" measured from *today*, not from March 2024. The historical answer is wrong.",
        correct: true,
      },
      { id: "c", text: "The backfill OOMs on Snowflake.", correct: false },
      { id: "d", text: "The backfill duplicates rows.", correct: false },
    ],
    explanation:
      "Using `CURRENT_DATE` or `now()` inside a transform breaks the \"pure function of time-partitioned input\" rule. When you re-run for March 2024, the transform sees today's date, not March's — so context from the future bleeds into the historical answer. The fix is to pass the *logical date* (the partition being processed) into the transform as a parameter, and use that instead.",
    sort_order: 5,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "What makes a pipeline *safely* backfillable?",
    options: [
      { id: "a", text: "Running it in a separate test environment first.", correct: false },
      {
        id: "b",
        text: "Idempotency. Re-running the same partition must overwrite cleanly rather than double-count, and the transform must be a pure function of its time-partitioned input (no `now()`, no current-state lookups).",
        correct: true,
      },
      { id: "c", text: "Storing checkpoints in a metadata table.", correct: false },
      { id: "d", text: "Running the backfill at night.", correct: false },
    ],
    explanation:
      "Idempotency is the precondition that makes backfill *safe*. Re-run March 2024 → same March 2024 output. That requires (a) partition overwrite or MERGE on a stable key (so reruns don't append), and (b) deterministic transforms (no current-state pollution). A non-idempotent pipeline simply cannot be backfilled safely.",
    sort_order: 6,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "A single malformed row arrives in an otherwise-good batch of 100M events. What's the right pattern?",
    options: [
      { id: "a", text: "Fail the entire batch; halt downstream.", correct: false },
      {
        id: "b",
        text: "Quarantine the bad row to a dead-letter queue (a side table or `s3://orders_dlq/`); let the other 99,999,999 rows through. Alert on the DLQ's depth so someone investigates.",
        correct: true,
      },
      { id: "c", text: "Silently drop the bad row.", correct: false },
      { id: "d", text: "Retry the row indefinitely until it succeeds.", correct: false },
    ],
    explanation:
      "The DLQ pattern from messaging systems applied to data records. Failing the whole batch wastes the good 99,999,999 rows. Dropping silently loses evidence. Quarantining preserves the bad data for inspection and replay while keeping the pipeline making progress. Alert on the quarantine's depth — if it grows, something upstream changed.",
    sort_order: 7,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "Your data team is paging the on-call engineer 3–4 times every night for retried-and-succeeded transient task failures. What's the right response?",
    options: [
      { id: "a", text: "Hire more on-call engineers to handle the volume.", correct: false },
      {
        id: "b",
        text: "Alert fatigue. Tune retries to absorb transient failures silently. Only page a human when retries are exhausted *and* the failure affects an SLA-tracked dataset. Separate \"page now\" from \"open a ticket.\"",
        correct: true,
      },
      { id: "c", text: "Turn off retries.", correct: false },
      { id: "d", text: "Move all pipelines to a single DAG so there's less to alert on.", correct: false },
    ],
    explanation:
      "Alert fatigue is the dominant operational risk once pipelines run unattended. Transient failures (network blips, source-DB hiccups) are constant — they should be retried, then forgotten. A human should be paged only when the retries fail AND a meaningful SLA is at risk. Distinguishing transient/permanent and \"page now\" / \"open a ticket\" is half the job.",
    sort_order: 8,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "What's the most important way a data SLA differs from a typical API SLA?",
    options: [
      { id: "a", text: "Data SLAs use a different SLI/SLO/SLA vocabulary.", correct: false },
      {
        id: "b",
        text: "Data SLAs are two-dimensional — freshness *and* completeness — where API SLAs are mostly one-dimensional (availability + latency). A dataset can be perfectly \"up\" and still violate its SLA by being stale or partial.",
        correct: true,
      },
      { id: "c", text: "Data SLAs don't apply during business hours.", correct: false },
      { id: "d", text: "API SLAs are stricter.", correct: false },
    ],
    explanation:
      "An API SLA is mostly about availability and latency — the response was returned within the budget. A data SLA has freshness (how recent is the data?) AND completeness (are all expected rows here, are quality checks passing?). The failure mode with no clean API analogue: the table exists, queries return instantly, but the data is stale or partial. Availability doesn't imply correctness.",
    sort_order: 9,
  },
  {
    checkpoint_slug: "checkpoint-pipeline-orchestration-and-reliability",
    prompt: "What does it mean to declare a *freshness policy on an asset* rather than an *SLA on a job*?",
    options: [
      { id: "a", text: "The job is no longer monitored.", correct: false },
      {
        id: "b",
        text: "You promise that the *data* (e.g., the `orders` mart) is no older than X hours, continuously checked — decoupled from whether any particular job ran or succeeded. Asset-centric tools (Dagster) can compute this and alert proactively.",
        correct: true,
      },
      { id: "c", text: "Only the asset's owner gets paged, not the on-call.", correct: false },
      { id: "d", text: "Freshness policies replace error budgets.", correct: false },
    ],
    explanation:
      "Job-level SLAs ask \"did this job finish on time?\" Asset-level freshness policies ask \"is this data current?\" — the contract is about the outcome, not the work. A job can succeed but produce stale data (an upstream sensor never fired), or the job can fail but the asset is still fresh enough (a recent earlier run produced good data). Asset-level freshness aligns with the consumer's real need — and matches the SRE shift from monitoring deploys to monitoring user-facing SLOs.",
    sort_order: 10,
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
