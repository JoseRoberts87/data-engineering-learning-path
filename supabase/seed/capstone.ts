export type CapstoneStepSeed = {
  slug: string;
  phase_slug: string | null;
  title: string;
  description: string;
  hints: string | null;
  sort_order: number;
};

export const capstoneSteps: CapstoneStepSeed[] = [
  {
    slug: "pick-source-and-define-contract",
    phase_slug: "thinking-in-data",
    title: "Pick a data source and define the contract",
    description:
      "Choose one dataset you'll work with across the whole capstone. Public options work well: a city open-data portal, GitHub Archive events, an air-quality API, or a CSV from data.gov. Document the schema you're consuming: column names, data types, nullability, update cadence, and any known quirks (missing values, inconsistent formats, unit ambiguity). This document IS your producer contract — even if the producer is the open internet.",
    hints:
      "Good starter sources: NYC TLC trip data (Parquet, partitioned by month), GitHub Archive (hourly JSON), OpenAQ air quality (REST), Open-Meteo weather (REST). Pick something with a stable, versioned schema — scraping HTML is more pain than it's worth for this project.",
    sort_order: 1,
  },
  {
    slug: "model-target-schema",
    phase_slug: "data-modeling-fundamentals",
    title: "Model a target schema",
    description:
      "Design the analytical tables a downstream consumer (a dashboard, a notebook, a model) would actually query. Identify what's a fact (measurable events, one row per event) vs. what's a dimension (slowly-changing context like users, vehicles, or sensor locations). Write the DDL. Pick a partition key that lines up with how the table will be filtered.",
    hints:
      "Use a single denormalized fact table for v1. Resist over-normalizing. Pick a partition column that matches the most common query filter (almost always a date). Defer slowly-changing-dimension complexity until you have a real use case.",
    sort_order: 2,
  },
  {
    slug: "build-idempotent-ingestion",
    phase_slug: "data-movement-and-transformation",
    title: "Build the ingestion step",
    description:
      "Write an idempotent load from your source into a 'raw' layer in the warehouse. The script must be safe to re-run on the same window without duplicating rows. Don't transform yet — just land the source data, preserving its original shape and column names. Verify idempotency by running the same window twice and checking row counts.",
    hints:
      "Idempotency tricks: write into a partition you can wholesale replace, or merge on a stable natural key. Keep the raw layer deliberately dumb — type coercion, deduplication, and joins all belong in later steps, not here.",
    sort_order: 3,
  },
  {
    slug: "orchestrate-the-pipeline",
    phase_slug: "pipeline-orchestration-and-reliability",
    title: "Orchestrate the pipeline",
    description:
      "Wire ingestion → staging → mart as a real DAG in an orchestrator (Airflow, Prefect, or Dagster). Each task declares its dependencies; downstream waits on upstream. Configure retries with exponential backoff on transient failures, set a freshness SLA on the final mart table (e.g., \"must be updated within 60 minutes of midnight UTC\"), and add a failure callback that actually reaches you (email, Slack webhook, or PagerDuty). Then prove the backfill works: pick a historical window, re-run the pipeline for that window, and confirm the historical partitions reproduce — without `now()` smearing today's reality across history.",
    hints:
      "Dagster's software-defined assets fit this curriculum especially well (asset = dataset; the DAG falls out of the dependency graph). Airflow is the default if you want the most familiar option. For backfills: parametrize your transforms with a `logical_date` argument, never `current_date()`; the value the orchestrator passes is the partition the task is producing, not the wall clock.",
    sort_order: 4,
  },
  {
    slug: "design-streaming-variant",
    phase_slug: "streaming-and-event-driven-data",
    title: "Design the streaming variant (don't build it)",
    description:
      "This step is paper-only: design, don't implement. Pick the one step in your pipeline that has the best case for being streaming (CDC from the source database? real-time enrichment of incoming events? a session-window aggregation?). Document: which stream-processing model would you use (record-at-a-time vs micro-batch, stateless vs stateful)? Which delivery semantic — at-least-once + idempotent sink, or transactional/exactly-once? What's your watermark + late-data policy? Finally, the most important part: justify why your current batch shape is (or isn't) the right call. \"The consumer's decision doesn't act on this data in seconds\" is a complete and respectable answer.",
    hints:
      "The point is the discipline of asking *whether* streaming pays back, not building infrastructure for the sake of it. Phase 5's batch-vs-streaming concept is the substrate. A good design doc here is 1-2 pages: the streaming candidate, the design choices, and the trade-off conclusion. Most learners' projects will rationally remain batch — that's a passing answer.",
    sort_order: 5,
  },
  {
    slug: "optimize-storage-and-cost",
    phase_slug: "storage-scale-and-compute",
    title: "Optimize storage and measure the cost delta",
    description:
      "Apply the Phase 6 techniques to your existing pipeline and *measure* the impact. Convert the raw layer to Parquet (or use a lakehouse table format — Iceberg or Delta). Partition by date. Cluster on the next-most-common filter column. Then run your typical analytical query (or the query a real downstream consumer would run) against the unoptimized and optimized versions. Capture bytes scanned and query time for each. Produce a single-line summary: \"Before X, after Y, Z-fold reduction.\" The capstone learning here is the measurement, not the technique — without the before/after, you don't actually know if your optimization worked.",
    hints:
      "DuckDB or a local Parquet + Polars setup is enough — you don't need a cloud warehouse to demonstrate this. Use `EXPLAIN ANALYZE` or query-plan output to read bytes scanned. If you want to push further: try Z-ordering or multi-column clustering and compare against single-column. The cost-as-performance lesson lands when you see the numbers.",
    sort_order: 6,
  },
  {
    slug: "ship-as-data-product",
    phase_slug: "data-platform-thinking",
    title: "Ship your mart as a data product",
    description:
      "Treat the final mart as something an external consumer would depend on. Write a *real* data contract: schema (columns, types, nullability), semantics (what each column actually means — \"revenue is net of refunds\" not just \"revenue: number\"), freshness SLA, quality guarantees (e.g., `customer_id` unique and non-null), owner (you), and change policy (how breaking changes will be handled). Back the contract with executable checks — dbt tests, Great Expectations, or hand-written SQL assertions. Surface lineage (dbt's auto-generated DAG works; column-level via tools like SQLMesh is a stretch goal). Finally, write the consumer-onboarding README: how another team would discover, understand, and start querying your data product without ever talking to you.",
    hints:
      "Don't skip the README — it's the test of whether the rest of the work paid off. If a stranger can clone your repo and successfully query your data within 15 minutes using only the README and the catalog page, you've built a data product. If they need to message you, you've built a pipeline. That distinction *is* Phase 7.",
    sort_order: 7,
  },
];
