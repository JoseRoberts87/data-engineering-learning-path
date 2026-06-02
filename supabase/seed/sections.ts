// Concept sections — structured, interactive content beyond the basic
// description + SWE analogy. Pulled from scrap/data1.txt, scrap/data2.txt,
// scrap/think_in_data.txt, scrap/deep_dive.txt, scrap/expansion.txt.

type FailureCatalogPayload = {
  title?: string;
  intro?: string;
  items: {
    scenario: string;
    consequence: string;
    swe_equivalent?: string | null;
    de_catches_it?: string | null;
  }[];
};

type ComparisonPayload = {
  title?: string;
  left_label: string;
  right_label: string;
  pairs: { left: string; right: string }[];
};

type DimensionsPayload = {
  title?: string;
  intro?: string;
  items: {
    name: string;
    description: string;
    swe_parallel?: string | null;
  }[];
};

type InlineQuizPayload = {
  prompt: string;
  options: { id: string; text: string; correct: boolean }[];
  explanation: string;
};

export type SectionSeed = { concept_slug: string; sort_order: number } & (
  | { type: "failure_catalog"; payload: FailureCatalogPayload }
  | { type: "comparison"; payload: ComparisonPayload }
  | { type: "dimensions"; payload: DimensionsPayload }
  | { type: "inline_quiz"; payload: InlineQuizPayload }
);

export const sections: SectionSeed[] = [
  // ═══════════════════════════════════════════════════════════════════
  // data-is-the-product
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "data-is-the-product",
    sort_order: 1,
    type: "failure_catalog",
    payload: {
      title: "Silently broken — failure modes that pass a green pipeline run",
      intro:
        "Each of these completes without throwing. The pipeline run says success. The data is wrong anyway. This taxonomy is why DE observability exists.",
      items: [
        {
          scenario: "A retry re-runs a load and writes duplicate rows.",
          consequence:
            "Every `SUM` aggregating the affected partition is inflated. Downstream dashboards over-report; nothing errors.",
          de_catches_it:
            "Uniqueness tests on natural keys; row-count reconciliation vs trailing average; idempotent transforms designed around `MERGE` or partition replacement.",
          swe_equivalent:
            "A non-idempotent POST handler retried by a client — except the client is your own orchestrator and the corruption is permanent.",
        },
        {
          scenario:
            "An upstream team adds a new event type your pipeline doesn't handle.",
          consequence:
            "Your `total_events` metric silently undercounts; the new traffic is invisible.",
          de_catches_it:
            "Schema-drift detection; assertions on the set of allowed categorical values; new-row-pattern alerts.",
          swe_equivalent:
            "A new enum value added to an upstream API that your switch statement falls through on.",
        },
        {
          scenario:
            "A source column starts arriving 20% null after a frontend deploy.",
          consequence:
            "Aggregations filtering on it now exclude a fifth of the population — silently.",
          de_catches_it:
            "Null-rate alerts vs trailing average; statistical tests on column distribution.",
          swe_equivalent:
            "A previously-required field becoming optional in an upstream API — but you don't get a deprecation notice.",
        },
        {
          scenario:
            "A timezone assumption breaks at a daylight-savings boundary and a day's worth of data lands in the wrong partition.",
          consequence:
            "Tuesday's data is in Monday's bucket; Tuesday looks empty; Monday looks 2x. Both numbers are wrong.",
          de_catches_it:
            "UTC end-to-end; per-day row-count alerts; tests that a partition's data actually falls within the partition's time range.",
          swe_equivalent:
            "A DST bug in a cron-driven job — but here it corrupts data forever, not just a single missed run.",
        },
        {
          scenario:
            "A join that was supposed to be one-to-one becomes one-to-many because of a bad uniqueness assumption.",
          consequence:
            "Row count fans out by the multiplicity factor. Every downstream `COUNT` and `SUM` is wrong by that factor.",
          de_catches_it:
            "Uniqueness tests on join keys; row-count assertions after every join.",
          swe_equivalent:
            "Closest analogue: an ORM relationship change that silently turns a `findOne` into a `findMany`.",
        },
      ],
    },
  },
  {
    concept_slug: "data-is-the-product",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "SWE habits vs DE habits",
      left_label: "Software engineer",
      right_label: "Data engineer",
      pairs: [
        {
          left: "\"Bug in the API means I'll fix a route.\"",
          right:
            "\"Wrong values in a table mean I'll add a validation step and backfill the affected partitions.\"",
        },
        {
          left: "\"Feature velocity is the key metric.\"",
          right: "\"Feature velocity AND data-quality velocity — both matter.\"",
        },
        {
          left: "\"Definition of done: the feature works.\"",
          right:
            "\"Definition of done: the dataset meets its SLA (freshness, completeness, accuracy).\"",
        },
        {
          left: "\"`200 OK` means it worked.\"",
          right:
            "\"Pipeline run succeeded ≠ data is correct. Green is necessary, not sufficient.\"",
        },
        {
          left: "Bugs page oncall.",
          right: "Bad data is silent. Trust quietly erodes until someone notices.",
        },
      ],
    },
  },
  {
    concept_slug: "data-is-the-product",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "Data observability — what you actually watch",
      intro:
        "Where SWE observability tracks CPU, memory, latency, and error rate, DE observability tracks five different signals. The first four have rough SWE analogues; the last one is the genuinely new dimension.",
      items: [
        {
          name: "Volume",
          description: "Did roughly the expected number of rows arrive?",
          swe_parallel: "Request rate",
        },
        {
          name: "Freshness",
          description: "Is the data as recent as it should be?",
          swe_parallel: "Request latency / time-to-serve",
        },
        {
          name: "Schema",
          description: "Did the shape of the data change — new column, removed column, type change?",
          swe_parallel: "API contract drift",
        },
        {
          name: "Distribution",
          description:
            "Did the values drift — sudden nulls, new categories, mean jumped, variance spiked?",
          swe_parallel:
            "No clean analogue — this is the genuinely new dimension SWE doesn't have a habit for.",
        },
        {
          name: "Lineage",
          description:
            "If this is wrong, what upstream caused it and what downstream is now affected?",
          swe_parallel: "Distributed tracing across services",
        },
      ],
    },
  },
  {
    concept_slug: "data-is-the-product",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "Which of these would page oncall in a typical web service but go entirely silent in a data pipeline?",
      options: [
        { id: "a", text: "An API returning 500 errors", correct: false },
        {
          id: "b",
          text: "Revenue on the daily dashboard off by 3% because a retry duplicated yesterday's payment events",
          correct: true,
        },
        { id: "c", text: "A database query timing out", correct: false },
        { id: "d", text: "An auth check failing", correct: false },
      ],
      explanation:
        "Web-service failures throw — monitoring catches them and pages oncall. Data corruption is silent: the pipeline completes successfully, every type check passes, and the wrong number sits on a dashboard until someone happens to reconcile it against an external source (often weeks later). The whole DE observability stack — volume, freshness, schema, distribution, lineage — exists because this category of failure has no analogue in SWE alerting.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // batch-vs-real-time
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "batch-vs-real-time",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "When the answer is batch vs streaming",
      left_label: "Batch is right",
      right_label: "Streaming is right",
      pairs: [
        {
          left: "Daily sales report read each morning at 9 AM",
          right: "Live trading dashboard a human watches throughout the day",
        },
        {
          left: "Monthly financial close (regulatory; needs immutable audit trail)",
          right: "Real-time fraud detection (blocks a transaction in <1s)",
        },
        {
          left: "Reprocessing is trivial — rerun the job for the affected window",
          right:
            "Reprocessing means replaying from a log offset, often against transform logic that has since changed",
        },
        {
          left: "Cost shape: job runs for 10 minutes, releases its resources",
          right: "Cost shape: standing infrastructure, 24/7, even when nothing is happening",
        },
        {
          left: "Bounded inputs, bounded outputs — easy to reason about",
          right:
            "Unbounded events, ongoing state — requires explicit handling of time, ordering, and failure",
        },
      ],
    },
  },
  {
    concept_slug: "batch-vs-real-time",
    sort_order: 2,
    type: "failure_catalog",
    payload: {
      title: "Problems streaming forces on you that batch sidesteps",
      intro:
        "These don't exist in batch because the window is closed before you compute. Streaming opens all of them.",
      items: [
        {
          scenario:
            "Event time vs. processing time: a phone buffers events offline and uploads them 3 hours late.",
          consequence:
            "Your '14:00 final' count was wrong by 17:00 when the buffered events arrived.",
          de_catches_it:
            "Watermarks (a heuristic for \"we think we've seen everything up to time T\") bound how long a window stays open before being finalized. You consciously trade staleness for completeness.",
          swe_equivalent:
            "Closest analogue: clock skew in distributed tracing, where you stitch spans from machines that disagree on `now()`.",
        },
        {
          scenario:
            "At-least-once delivery: most streaming infrastructure delivers each message at least once under failure.",
          consequence:
            "A payment event processed twice → revenue double-counted in real time.",
          de_catches_it:
            "Idempotent consumers (deduplication on a stable event ID). \"Exactly-once\" is mostly marketing — what you actually build is at-least-once + idempotency.",
          swe_equivalent:
            "Same flavor as designing an SQS consumer that handles duplicate deliveries safely.",
        },
        {
          scenario:
            "Reprocessing asymmetry: you find a bug after a week of processing.",
          consequence:
            "In batch you rerun the job for the week. In streaming you replay from an offset against logic that may have changed since those events were emitted.",
          de_catches_it:
            "Maintaining a parallel batch path (Lambda architecture) for backfills, or designing transforms to be replay-safe (Kappa architecture). Neither is free.",
        },
        {
          scenario:
            "Distributed state: counting events in a 10-minute sliding window across a billion records.",
          consequence:
            "State has to live somewhere — checkpoints, recovery on operator failure, partition rebalancing — all become first-class concerns.",
          de_catches_it:
            "Stream processors (Flink, Spark Structured Streaming) manage this for you, but you have to understand it to debug it.",
        },
      ],
    },
  },
  {
    concept_slug: "batch-vs-real-time",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "What you're trading off",
      intro:
        "Streaming isn't \"the modern choice\" — it's a specific bundle of trade-offs. Make the call on the actual axes.",
      items: [
        {
          name: "Latency",
          description: "Batch: minutes to hours. Streaming: milliseconds to seconds.",
        },
        {
          name: "Cost",
          description:
            "Batch releases resources after the run. Streaming runs continuously — you pay 24/7 even on quiet weekends.",
        },
        {
          name: "Reasoning complexity",
          description:
            "Batch: bounded inputs, deterministic outputs, easy to test. Streaming: state, timing, ordering, and failure all become explicit concerns.",
        },
        {
          name: "Reprocessing",
          description:
            "Batch reruns are trivial. Stream replays depend on log retention, transform compatibility, and whether your state can be rebuilt.",
        },
        {
          name: "Operational burden",
          description:
            "Batch fails loudly at 3 AM. Streaming fails subtly: a slow consumer accumulates lag, a watermark stops advancing, state grows unboundedly.",
        },
      ],
    },
  },
  {
    concept_slug: "batch-vs-real-time",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "A marketing analyst reviews the previous day's signup dashboard at 9 AM each morning. The CTO suggests making it real-time \"because fresher is better.\" What's the disciplined response?",
      options: [
        { id: "a", text: "Build the streaming pipeline — CTOs are usually right.", correct: false },
        {
          id: "b",
          text: "Push back: the decision cadence (daily review) should drive the freshness target. A nightly batch is the right tool.",
          correct: true,
        },
        {
          id: "c",
          text: "Build both batch and streaming so the team can choose at runtime.",
          correct: false,
        },
        {
          id: "d",
          text: "Build streaming, but only enable it during business hours.",
          correct: false,
        },
      ],
      explanation:
        "Real-time is standing infrastructure — you pay for it 24/7 and inherit a class of hard problems batch sidesteps (event time, late arrivals, exactly-once semantics, distributed state). If the only consumer reads the dashboard once each morning, real-time freshness is 24/7 theater. The discipline: latency should be driven by the decision, not the data.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // understanding-data-consumers
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "understanding-data-consumers",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "API consumer vs data consumer",
      left_label: "API consumer (your SWE intuition)",
      right_label: "Data consumer (analyst, BI tool, ML pipeline)",
      pairs: [
        {
          left: "Reads a documented contract before integrating",
          right: "Explores tables in a warehouse; finds out what's there by trying",
        },
        {
          left: "Compiler / type system catches contract violations at build time",
          right: "Wrong data passes silently — no compiler can check semantics",
        },
        {
          left: "Failures throw — visible at request time",
          right: "Failures are values: a wrong number sits in a dashboard, unflagged",
        },
        {
          left: "Cares about latency, response shape, error codes",
          right: "Cares about grain, definitions, freshness, completeness, point-in-time correctness",
        },
        {
          left: "Will see breaking changes in their deploy logs",
          right: "May never know the source moved to a new computation — they just see different numbers",
        },
      ],
    },
  },
  {
    concept_slug: "understanding-data-consumers",
    sort_order: 2,
    type: "failure_catalog",
    payload: {
      title: "Signature ways data consumers get hurt",
      intro: "Each of these has no clean SWE analogue. They are the consumer-side failure modes DE owns.",
      items: [
        {
          scenario:
            "Training/serving skew: an ML model's feature is computed one way in batch SQL (training) and another way in the production serving code path.",
          consequence:
            "92% accuracy in offline evaluation → 60% in production. The model isn't broken; the feature isn't the same number in both places.",
          de_catches_it:
            "Feature stores (Feast, Tecton, SageMaker Feature Store) — a single computation engine that serves both training and inference paths.",
          swe_equivalent:
            "Closest: shared business logic between client and server that drifts apart over time.",
        },
        {
          scenario:
            "Point-in-time leakage: a feature like `customer_lifetime_value` accidentally includes purchases that happened *after* the prediction point.",
          consequence:
            "The model looks brilliant in evaluation (because it's peeking at the future), then fails in production where the future doesn't exist yet.",
          de_catches_it:
            "As-of joins that reconstruct exactly what was known at the moment of prediction; feature stores with explicit point-in-time semantics.",
        },
        {
          scenario:
            "Definition fragmentation: marketing's \"signup,\" finance's \"signup,\" and product's \"signup\" turn out to be three different numbers.",
          consequence:
            "Two VPs walk into a meeting with conflicting dashboards both labeled \"new users.\" Trust in all data dies.",
          de_catches_it:
            "Semantic / metrics layer (dbt MetricFlow, Cube, LookML) — one governed definition that every dashboard pulls from.",
          swe_equivalent:
            "Three teams shipping their own clients that each interpret a JSON-RPC response field differently.",
        },
        {
          scenario:
            "Wrong grain: an analyst aggregates a fact table assuming one-row-per-order, but the source emits one-row-per-line-item.",
          consequence: "Revenue triples (or whatever the average line-items-per-order multiplier is).",
          de_catches_it:
            "Uniqueness tests on the assumed-unique key; explicit `grain:` documentation on every model in dbt or similar.",
        },
      ],
    },
  },
  {
    concept_slug: "understanding-data-consumers",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "Who the consumer actually is",
      intro:
        "\"Data consumer\" is not one persona. Different consumers want very different things from the same table — and your contract has to satisfy all of them.",
      items: [
        {
          name: "Analyst (writing SQL)",
          description:
            "Wants intuitive column names, clear definitions, joinable shape, freshness within their decision cadence.",
        },
        {
          name: "BI tool (Looker, Tableau, Mode)",
          description:
            "Wants a stable schema, predictable refresh, and a semantic layer to map to its model.",
        },
        {
          name: "ML training pipeline",
          description:
            "Wants reproducibility (same input → same training data), point-in-time correctness, no train/serve skew.",
          swe_parallel: "Closest: a build that needs deterministic outputs from deterministic inputs",
        },
        {
          name: "ML serving (real-time)",
          description:
            "Wants the *exact same* feature computation as training, plus low latency for live inference.",
        },
        {
          name: "External partner / SaaS export",
          description:
            "Wants versioning, encryption at rest and in transit, schema stability measured in months.",
        },
      ],
    },
  },
  {
    concept_slug: "understanding-data-consumers",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "An ML model has 92% offline accuracy but 60% in production. The team hasn't changed the model, the features, or the input data. What's the most likely cause?",
      options: [
        { id: "a", text: "The model is overfit to the training set.", correct: false },
        {
          id: "b",
          text: "Training/serving skew — the feature was computed via batch SQL in training but a different code path in the serving stack.",
          correct: true,
        },
        { id: "c", text: "Random variance; just retrain it.", correct: false },
        { id: "d", text: "The model needs more training data.", correct: false },
      ],
      explanation:
        "When offline accuracy is dramatically higher than online, the culprit is almost always that the feature you trained on and the feature you serve aren't actually the same number. The fix is a feature store — a single computation engine that produces the feature once and serves both training and inference paths — or, at minimum, code-level parity between the two paths.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // schemas-as-contracts
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "schemas-as-contracts",
    sort_order: 1,
    type: "failure_catalog",
    payload: {
      title: "Schema changes that silently corrupt",
      intro:
        "The structural breaks (rename, type change) usually fail loudly. The killers are the changes that pass every automated check.",
      items: [
        {
          scenario:
            "Semantic redefinition: `revenue` is redefined from gross to net while keeping the same name and float type.",
          consequence:
            "Every `SUM(revenue)` downstream is now systematically wrong. Every type check still passes. Finance notices weeks later during reconciliation.",
          de_catches_it:
            "Data contracts that include semantic descriptions (not just shape); consumer-side reconciliation tests against an independent source.",
          swe_equivalent:
            "Changing what a function returns while keeping the same signature — but you can't grep for callers because the callers are in someone else's SQL.",
        },
        {
          scenario:
            "Grain change: a table goes from one-row-per-order to one-row-per-line-item.",
          consequence: "`COUNT(*)` and `SUM(revenue)` are off by ~3× (the average line-items per order).",
          de_catches_it:
            "Uniqueness tests on join keys; explicit grain documentation; row-count alerts against trailing average.",
        },
        {
          scenario:
            "Unit silently changed: a `weight` column flips from kilograms to grams without renaming.",
          consequence: "Every aggregation is off by 1000×.",
          de_catches_it: "Range / distribution tests; data-contract review on any source field change.",
        },
        {
          scenario:
            "Type narrowing by coincidence: an `id` column changes from string to int because all current values happen to be numeric.",
          consequence:
            "First record with a non-numeric ID either crashes the pipeline or gets silently cast and corrupted.",
          de_catches_it:
            "Schema registry rejects breaking compatibility; type tests on raw landings before any transform runs.",
        },
      ],
    },
  },
  {
    concept_slug: "schemas-as-contracts",
    sort_order: 2,
    type: "dimensions",
    payload: {
      title: "Compatibility directions",
      intro:
        "\"Is this schema change safe?\" isn't yes/no — it's relative to a *direction* of upgrade. Pick one and the rules become concrete.",
      items: [
        {
          name: "Backward",
          description:
            "New code reads old data. Safe when consumers upgrade *before* producers. Adding a nullable field is backward-compatible.",
          swe_parallel: "Adding an optional field to a JSON response",
        },
        {
          name: "Forward",
          description:
            "Old code reads new data. Safe when producers upgrade *first*. Consumers must ignore fields they don't recognize.",
          swe_parallel: "A protobuf message gaining new fields — old binaries ignore them",
        },
        {
          name: "Full",
          description:
            "Both backward and forward. The safest mode, but the most restrictive — almost only additive nullable changes survive.",
        },
        {
          name: "Breaking",
          description:
            "Neither direction is safe. Requires a coordinated migration: dual-write, deprecate, then remove. Examples: rename, type change, removing a field, changing the grain.",
        },
      ],
    },
  },
  {
    concept_slug: "schemas-as-contracts",
    sort_order: 3,
    type: "comparison",
    payload: {
      title: "API contract vs data contract",
      left_label: "API contract",
      right_label: "Data contract",
      pairs: [
        {
          left: "Versioned at a point in time",
          right: "Versioned over time AND across all historical data ever produced",
        },
        {
          left: "Deprecate, sunset, remove — clients adapt within a window",
          right: "Old data persists. The schema has to keep accepting records produced months ago.",
        },
        {
          left: "Mostly governs request/response shape and types",
          right: "Governs shape, semantics (what does this column *mean*?), freshness, ownership, SLAs",
        },
        {
          left: "Compiler catches structural mismatches at build time",
          right: "Schema registry catches structural mismatches at write time",
        },
        {
          left: "Type system catches type changes",
          right:
            "Semantic changes (gross→net, kg→g, grain shifts) are invisible to type systems. Catching them requires explicit semantic tests.",
        },
      ],
    },
  },
  {
    concept_slug: "schemas-as-contracts",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt: "Which schema change is most dangerous because it passes every automated check?",
      options: [
        { id: "a", text: "Renaming `customer_id` to `cust_id`", correct: false },
        { id: "b", text: "Changing a column from `int` to `float`", correct: false },
        {
          id: "c",
          text: "Redefining `revenue` from gross to net while keeping the same name and float type",
          correct: true,
        },
        { id: "d", text: "Adding a new non-nullable column without a default", correct: false },
      ],
      explanation:
        "The structural changes (rename, type change, missing default) typically break consumers or get rejected by the schema registry — they fail loudly. The killer is the *semantic* change: column name, type, and shape are unchanged, every type check passes, every `SUM(revenue)` downstream is now systematically wrong, and you find out weeks later when finance reconciles manually. This is why mature data contracts include semantic descriptions alongside the structural schema.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // failures-are-backlogs
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "failures-are-backlogs",
    sort_order: 1,
    type: "failure_catalog",
    payload: {
      title: "Cascade scenarios",
      intro:
        "Each of these is what \"3 AM page\" actually looks like for DE — not a single failed request, but a cascading state problem.",
      items: [
        {
          scenario:
            "Single upstream failure: job B fails at 2 AM in a DAG where D depends on A, B, C (parallel).",
          consequence:
            "D doesn't run. Every dashboard downstream of D is stale by morning. You have to backfill B's gap *while* today's run is also queueing.",
          de_catches_it:
            "Orchestrator (Airflow, Dagster, Prefect) alerts on missed SLAs and exposes the dependency graph so you can see the blast radius.",
        },
        {
          scenario:
            "Partial write: job 7 of 20 fails after jobs 1–6 already wrote their outputs.",
          consequence:
            "Half the day's tables are updated, half aren't. Joins return inconsistent results until both sides catch up.",
          de_catches_it:
            "Atomic / transactional swaps where possible; idempotent transforms so reruns of 1–6 are harmless.",
        },
        {
          scenario: "Catch-up storm: after a 24-hour outage, all backfilled runs queue at once.",
          consequence:
            "Cluster oversubscribed, SLA violations compound, and pipelines processed in wrong order can read partial upstreams.",
          de_catches_it:
            "Per-DAG concurrency limits, explicit catchup config, and backfill-aware scheduling.",
        },
        {
          scenario:
            "Silent skip: an upstream job \"succeeded\" but emitted zero rows because of a filter bug.",
          consequence:
            "Downstream jobs run on empty data, write empty (or near-empty) outputs, dashboards show plausible-looking zeros.",
          de_catches_it:
            "Volume tests (row count vs trailing average); freshness checks that verify *content*, not just timestamps.",
        },
      ],
    },
  },
  {
    concept_slug: "failures-are-backlogs",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "Web-request failure vs pipeline failure",
      left_label: "Web request",
      right_label: "Pipeline",
      pairs: [
        {
          left: "Isolated: one user, one retry, world moves on",
          right: "Cascading: every downstream job blocks until you fix it",
        },
        {
          left: "Recovery is automatic (the user retries)",
          right: "Recovery is a backfill — a separate engineering task with its own risks",
        },
        {
          left: "Latency budget bounds the blast radius",
          right: "Time-to-detect can be hours; time-to-recover can be days",
        },
        {
          left: "Per-request observability (errors, latency)",
          right:
            "Per-partition observability — \"was today's run complete? was yesterday's correct?\"",
        },
        {
          left: "Idempotency is nice-to-have on PUT/DELETE",
          right: "Idempotency is mandatory — backfills double-count without it",
        },
      ],
    },
  },
  {
    concept_slug: "failures-are-backlogs",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "Where orchestrators actually help",
      intro:
        "Airflow, Dagster, and Prefect aren't just schedulers — they're failure-recovery infrastructure. These are the levers they give you.",
      items: [
        {
          name: "Dependency graph",
          description:
            "Codifies what depends on what, so a failure in B blocks all downstream automatically — you don't have to remember.",
        },
        {
          name: "Backfill UI",
          description:
            "Re-run a specific time window without re-running the entire history. Critical when bugs are scoped to a date range.",
        },
        {
          name: "Retry policy",
          description: "Per-task config for exponential backoff, dead-letter, and escalation paths.",
        },
        {
          name: "SLA monitoring",
          description:
            "Alerts when a job hasn't completed by its expected time — not just when it actively errors. Silent stalls are caught.",
        },
        {
          name: "Lineage view",
          description: "Shows the upstream-to-downstream blast radius of any failure visually.",
        },
      ],
    },
  },
  {
    concept_slug: "failures-are-backlogs",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "A daily DAG has 20 jobs. Job 7 fails at 2 AM. By the time you notice at 8 AM, what's the most likely state?",
      options: [
        { id: "a", text: "Jobs 7–20 all auto-retried successfully.", correct: false },
        {
          id: "b",
          text: "Jobs 1–6 wrote correct data; jobs 7–20 didn't run; every dashboard consuming jobs 8–20's outputs is empty or stale.",
          correct: true,
        },
        { id: "c", text: "The orchestrator skipped job 7 and continued with 8–20.", correct: false },
        {
          id: "d",
          text: "Only the dashboard consuming job 7's direct output is affected.",
          correct: false,
        },
      ],
      explanation:
        "DAG dependencies mean a failed upstream blocks every downstream — jobs 1–6 already wrote their (correct) outputs, jobs 7–20 sit waiting, and every dashboard built on the chain from 7 onward is stale. Recovery is multi-step: fix the bug, backfill the gap, and ensure today's queued run doesn't double-execute the recovery. This compounding shape is why orchestrator tooling exists in DE in a way it doesn't for typical web services.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // idempotency-as-mindset
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "idempotency-as-mindset",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Append-thinking vs end-state thinking",
      left_label: "SWE habit (append-thinking)",
      right_label: "DE habit (end-state thinking)",
      pairs: [
        {
          left: "INSERT a row when this event arrives",
          right:
            "Make the table reflect the desired end state, regardless of how many times this runs",
        },
        {
          left: "Rely on processing order",
          right: "Operations are order-independent, or use an explicit ordering key from the source",
        },
        {
          left: "Use `now()` in the row body",
          right: "Use deterministic timestamps derived from the source event",
        },
        {
          left: "Random IDs and seeds generated at write time",
          right: "Deterministic IDs from a hash of stable inputs",
        },
        {
          left: "Backfill = surgical row updates and prayer",
          right: "Backfill = re-run the partition; the transform reaches the same end state",
        },
      ],
    },
  },
  {
    concept_slug: "idempotency-as-mindset",
    sort_order: 2,
    type: "failure_catalog",
    payload: {
      title: "What goes wrong without idempotency",
      items: [
        {
          scenario:
            "Double-counted backfill: pipeline appends rows. Team re-runs for 30 days to fix a bug.",
          consequence: "Every row from those 30 days now exists twice; all aggregations are 2× too high.",
          de_catches_it: "Per-partition replacement (DELETE+INSERT, MERGE on key, or partition swap).",
        },
        {
          scenario: "Retried-and-doubled: transient cluster failure mid-run; orchestrator retries from the start.",
          consequence:
            "First half of the partition is written twice; silent data inflation in exactly the runs that failed.",
          de_catches_it: "Atomic writes; transactional swap; or row-level idempotency via MERGE.",
        },
        {
          scenario:
            "Non-deterministic `now()`: row body contains `processed_at = now()`. Rerun stamps a different timestamp.",
          consequence:
            "Reruns produce *different* data, not the same data twice. Subsequent joins on `processed_at` fail to match.",
          de_catches_it: "Compute timestamps from source event time, not processing time.",
        },
        {
          scenario:
            "Order-dependent transform: a SQL window function depends on the order rows arrived, which is non-deterministic across runs.",
          consequence: "Same input data, different outputs on each rerun.",
          de_catches_it:
            "Explicit `ORDER BY` on a deterministic key (event_id, source_timestamp + tiebreaker).",
        },
      ],
    },
  },
  {
    concept_slug: "idempotency-as-mindset",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "How to make a transform idempotent",
      intro:
        "Concrete patterns. Pick the one that fits your storage layer; layer multiple if needed.",
      items: [
        {
          name: "MERGE on natural key",
          description: "INSERT new rows, UPDATE matched. Standard in Postgres, BigQuery, Snowflake.",
          swe_parallel: "PUT semantics: same body produces same end state",
        },
        {
          name: "Partition replacement",
          description: "`DELETE FROM table WHERE date = X; INSERT INTO table SELECT ...`",
          swe_parallel: "Idempotent file write: overwrite the named file",
        },
        {
          name: "Atomic swap",
          description: "Build a new table; rename it into place at the end. All-or-nothing.",
          swe_parallel: "Blue-green deploy",
        },
        {
          name: "Hash-based dedup",
          description: "Compute a deterministic row hash; insert only if hash not previously seen.",
          swe_parallel: "Idempotency keys on payment APIs",
        },
      ],
    },
  },
  {
    concept_slug: "idempotency-as-mindset",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "A pipeline writes daily summary rows. The team needs to backfill 30 days because of a logic bug. Which write strategy makes the backfill safe?",
      options: [
        { id: "a", text: "Append-only — the corrected logic will produce the right new rows.", correct: false },
        {
          id: "b",
          text: "Per-partition replacement — delete the day's rows, then insert the corrected ones.",
          correct: true,
        },
        { id: "c", text: "Skip the backfill and add a footnote to the dashboard.", correct: false },
        { id: "d", text: "Run the backfill at night so users don't notice.", correct: false },
      ],
      explanation:
        "Per-partition replacement makes the backfill idempotent: re-running for a given day overwrites the existing rows, so the table ends up reflecting the corrected logic regardless of how many times you ran it. Append-only would double-count for 30 days; skipping leaves bad data in place. The broader habit: design transforms to produce a *desired end state*, not to append events.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // statistical-testing
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "statistical-testing",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Exact assertion vs property assertion",
      left_label: "SWE habit (exact)",
      right_label: "DE habit (property)",
      pairs: [
        {
          left: "`assertEqual(result, 42)`",
          right: "`assert 1000 < row_count < 1_000_000`",
        },
        {
          left: "Test the specific input you fixed",
          right: "Test invariants the dataset should hold across all inputs",
        },
        {
          left: "Pass = code is correct",
          right: "Pass = the dataset's *shape* hasn't deviated from expectation",
        },
        {
          left: "Local: against a known fixture",
          right: "Continuous: against production data, every run",
        },
        {
          left: "Failure means a code bug",
          right: "Failure could be: a code bug, upstream drift, or a valid-but-anomalous business event",
        },
      ],
    },
  },
  {
    concept_slug: "statistical-testing",
    sort_order: 2,
    type: "failure_catalog",
    payload: {
      title: "What property checks catch that type checks miss",
      items: [
        {
          scenario:
            "Volume drop: daily row count goes from 50K to 48K — every type and schema check passes.",
          consequence:
            "4% of events silently dropped. Dashboard numbers quietly lower. Probably an upstream filter change.",
          de_catches_it: "Row count within X% of trailing 7-day average.",
          swe_equivalent:
            "An API quietly losing 4% of requests — visible in request-rate dashboards but not in error logs.",
        },
        {
          scenario: "Distribution shift: mean of `order_value` jumps from $45 to $145 overnight.",
          consequence:
            "Could be a real promotion, or a missing decimal point. Both pass schema validation.",
          de_catches_it: "Distribution / sigma tests; alerts on mean / median shift vs baseline.",
        },
        {
          scenario:
            "New categorical: `country_code` starts including a value not in the known enum.",
          consequence: "Joins to `dim_country` produce nulls; aggregations silently exclude the new country.",
          de_catches_it: "Categorical-membership tests (`column in expected_set`).",
        },
        {
          scenario: "Null-rate spike: a formerly-required field is now 30% null.",
          consequence: "Aggregations that filter on it now exclude 30% of rows.",
          de_catches_it: "Null-rate alerts vs trailing average.",
        },
      ],
    },
  },
  {
    concept_slug: "statistical-testing",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "Properties worth asserting",
      intro:
        "A library of useful invariants. Mix and match per table — most production datasets need 5–10 active assertions.",
      items: [
        {
          name: "Uniqueness",
          description: "Primary keys, business keys, (user_id, date) combinations — never duplicated",
          swe_parallel: "DB constraints — but enforced after the write, not at insert time",
        },
        { name: "Nullability", description: "Columns that should never (or rarely) be null" },
        {
          name: "Range / domain",
          description: "Numerics within bounds; categoricals in a known set; dates in a plausible window",
        },
        {
          name: "Referential integrity",
          description: "Foreign keys resolve to a parent row in the dim table",
        },
        {
          name: "Cardinality",
          description: "Distinct-value count within expected range (catches new categories, lost categories)",
        },
        {
          name: "Distribution",
          description: "Mean, median, percentiles within expected drift bounds vs a trailing window",
        },
        {
          name: "Volume / freshness",
          description: "Row count + max(timestamp) within thresholds — \"is this table being updated?\"",
        },
      ],
    },
  },
  {
    concept_slug: "statistical-testing",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "Your daily revenue pipeline normally outputs ~50,000 rows. Today it outputs 48,200 and every existing test passes. What kind of test most likely catches an issue you'd otherwise miss?",
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
        "Type checks, schema checks, and nullability tests all pass because the data is structurally fine — there's just less of it than expected. The miss is a *statistical* property: today's row count is ~4% below the trailing average. Tools like Great Expectations, dbt's `accepted_range` / freshness tests, and Monte Carlo specialize in this style of assertion.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // time-as-engineering-problem
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "time-as-engineering-problem",
    sort_order: 1,
    type: "dimensions",
    payload: {
      title: "The three clocks you keep straight",
      intro:
        "App backends usually treat \"time\" as a single concept. In DE you juggle at least three — and queries can ask about any of them.",
      items: [
        {
          name: "Event time",
          description:
            "When something actually happened. The user clicked the button at 14:32:05 in their local timezone.",
          swe_parallel: "Source-side timestamp in the event body",
        },
        {
          name: "Ingestion time",
          description:
            "When the event arrived at your system. Could be 5 seconds later, or 3 hours later if the phone was offline.",
          swe_parallel: "Server-side timestamp at the load balancer / gateway",
        },
        {
          name: "Processing time",
          description:
            "When your pipeline acted on it. Could be milliseconds after ingestion, or the next morning's batch.",
          swe_parallel: "Job execution timestamp",
        },
      ],
    },
  },
  {
    concept_slug: "time-as-engineering-problem",
    sort_order: 2,
    type: "failure_catalog",
    payload: {
      title: "Time bugs that compound silently",
      items: [
        {
          scenario:
            "SCD overwrite: a dim table is updated in place when a customer changes shipping address.",
          consequence:
            "All historical orders now appear to ship to the new address. Historical reports lie.",
          de_catches_it:
            "SCD Type 2: keep every version of the dim row with `valid_from` / `valid_to` ranges; joins as-of the order date return historical truth.",
          swe_equivalent: "Mutating a record vs event-sourcing the change",
        },
        {
          scenario: "Late-arriving data: a phone uploads buffered events 3 hours after they happened.",
          consequence:
            "Your \"final\" hourly count for 14:00 was wrong by 17:00 when the buffered events arrived.",
          de_catches_it:
            "Watermarks in stream processing; partial-day retransforms in batch; explicit \"final at T + grace_period\" SLAs.",
        },
        {
          scenario: "Timezone shift: the pipeline assumes UTC; the source emits local time.",
          consequence:
            "Up to 24 hours of data ends up in the wrong date partition; daily aggregations are wrong on both sides.",
          de_catches_it:
            "Timezone normalization at ingestion; tests that the date partition matches the data's actual time range.",
        },
        {
          scenario:
            "DST boundary: on the day clocks change, one hour appears twice (fall back) or is missing (spring forward).",
          consequence: "Aggregations include duplicates or have gaps for that hour, forever.",
          de_catches_it: "Use UTC end-to-end; convert to local only at display time.",
        },
      ],
    },
  },
  {
    concept_slug: "time-as-engineering-problem",
    sort_order: 3,
    type: "comparison",
    payload: {
      title: "App database vs analytics database — the time model",
      left_label: "App database",
      right_label: "Analytics database",
      pairs: [
        {
          left: "Mutable: the address column has the current value",
          right: "Append-only or temporal: every address ever, with validity range",
        },
        { left: "\"What is true now?\"", right: "\"What was true on date X?\"" },
        {
          left: "Foreign keys point to the live row",
          right: "Foreign keys point to a specific version of the row, as-of a timestamp",
        },
        { left: "Updates overwrite history", right: "Updates emit a new version; old versions stay queryable" },
        {
          left: "Time is a timestamp on rows",
          right: "Time is event time, ingestion time, processing time — three distinct columns",
        },
      ],
    },
  },
  {
    concept_slug: "time-as-engineering-problem",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "A customer changed shipping address on March 1. They placed an order on February 15 (shipped to the old address) and another on March 10 (shipped to the new). Your data model needs to answer \"where did this user actually ship orders to?\" over history. What's required?",
      options: [
        { id: "a", text: "Just store the current address; analysts can ignore old data.", correct: false },
        {
          id: "b",
          text: "Slowly-Changing-Dimension (SCD) Type 2 — keep every address version with validity ranges.",
          correct: true,
        },
        { id: "c", text: "Always recompute orders against the current address.", correct: false },
        { id: "d", text: "Just put a timestamp on the order row.", correct: false },
      ],
      explanation:
        "Application databases overwrite (the address column has the new value, period). Analytics needs the *historical* truth — joining the order to the address as-of the order's date. SCD Type 2 keeps every version with `valid_from`/`valid_to` so the join returns the address that was in effect at the time of the order. The broader habit: in DE, time and history are first-class problems.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // scale-and-cost-as-design-axes
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "scale-and-cost-as-design-axes",
    sort_order: 1,
    type: "failure_catalog",
    payload: {
      title: "Scale issues that don't show up locally",
      intro:
        "Each of these passes a unit test on 100 rows. At 1B rows in production, they're the difference between viable and ruinous.",
      items: [
        {
          scenario: "Data skew: a `GROUP BY` where one key holds 90% of the rows.",
          consequence:
            "The shuffle phase concentrates all that data on one executor; the job runs for hours or OOMs.",
          de_catches_it:
            "Skew detection in query plans; salting (split the hot key); pre-aggregation; Adaptive Query Execution in Spark.",
        },
        {
          scenario: "Full-table scan: query missing a partition filter on a multi-TB table.",
          consequence: "Cluster scans every partition; a $40 query becomes a $400 query.",
          de_catches_it:
            "Required partition filters at the table level; query-plan inspection in CI; cost-budgeted gating before running.",
        },
        {
          scenario:
            "Cartesian explosion: a join that should be one-to-one is actually one-to-many.",
          consequence: "Result set blows up by orders of magnitude; downstream jobs time out or OOM.",
          de_catches_it: "Uniqueness tests on join keys; row-count alerts immediately after each join.",
        },
        {
          scenario: "Memory-bound aggregation: `COUNT(DISTINCT ...)` over a high-cardinality column.",
          consequence: "Either OOMs the executor or runs orders of magnitude slower than approximate counting.",
          de_catches_it:
            "Use `APPROX_COUNT_DISTINCT` (HyperLogLog) above ~100M cardinality; explicit memory-aware tooling.",
        },
      ],
    },
  },
  {
    concept_slug: "scale-and-cost-as-design-axes",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "Big-O for code vs cost for queries",
      left_label: "SWE habit",
      right_label: "DE habit",
      pairs: [
        {
          left: "Time complexity matters for latency",
          right: "Bytes-scanned matters for *both* latency AND cost",
        },
        {
          left: "A nested loop is O(n²) and slow",
          right:
            "A nested loop is O(n²), slow, AND racks up cloud bill in proportion to n. Cost is correctness-adjacent.",
        },
        {
          left: "Indexes speed up point lookups",
          right: "Partitioning lets the engine *skip* entire files of data",
        },
        {
          left: "\"Premature optimization is the root of all evil.\"",
          right: "Premature pessimization — full scans, no partitions — is what burns the budget.",
        },
        {
          left: "Worst-case complexity drives code review",
          right: "Both worst-case AND average-case bytes-scanned drive code review",
        },
      ],
    },
  },
  {
    concept_slug: "scale-and-cost-as-design-axes",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "Cost-shaping levers you actually have",
      intro:
        "Cloud warehouses charge by bytes scanned or compute consumed. These are the levers — pick the ones that match your access pattern.",
      items: [
        {
          name: "Partitioning",
          description:
            "Split the table by a key the query planner can prune on. Date is the usual win.",
          swe_parallel: "Sharding — but for read pruning, not write distribution",
        },
        {
          name: "Clustering / sort key",
          description:
            "Within a partition, sort rows so similar values cluster — improves further pruning and compression.",
          swe_parallel: "Composite indexes",
        },
        {
          name: "Columnar storage (Parquet, ORC)",
          description:
            "A 2-column query touches 2 column files, not the whole row. Order of magnitude IO win.",
          swe_parallel: "Struct-of-arrays vs array-of-structs",
        },
        {
          name: "Incremental models",
          description:
            "Process only new partitions, not the whole history. dbt's incremental models are the canonical pattern.",
          swe_parallel: "Delta updates vs full rebuilds",
        },
        {
          name: "Materialized views / pre-aggregation",
          description: "Pay the compute once at write time; reads are cheap many times.",
        },
      ],
    },
  },
  {
    concept_slug: "scale-and-cost-as-design-axes",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
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
        "Partitioning splits a table into separate physical files keyed by a column (here, `event_date`). When the query's WHERE filters on the partition key, the engine prunes (skips entirely) every partition that can't match — turning a full-table scan into a one-partition scan. At scale this is the difference between $40 and $0.55 per query. Partition pruning isn't \"just an optimization\" — it's the difference between viable and ruinously expensive.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // normalization-vs-denormalization
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "normalization-vs-denormalization",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Same data, opposite optimizations",
      left_label: "Normalized (OLTP)",
      right_label: "Denormalized (OLAP)",
      pairs: [
        { left: "Every fact stored exactly once", right: "Fields baked onto each row of the consuming table" },
        {
          left: "An UPDATE touches one place — no anomalies",
          right: "Data is immutable history — no anomalies to avoid",
        },
        {
          left: "Reads reassemble the picture via joins",
          right: "Reads return self-contained rows — no joins",
        },
        {
          left: "Cheap writes, expensive reads at scale",
          right: "Expensive writes (mostly batch), cheap reads",
        },
        {
          left: "Columnar compression of repeated values: not applicable",
          right: "Repeated values compress to almost nothing — duplication is nearly free to store",
        },
      ],
    },
  },
  {
    concept_slug: "normalization-vs-denormalization",
    sort_order: 2,
    type: "failure_catalog",
    payload: {
      title: "When the wrong choice burns you",
      items: [
        {
          scenario: "Normalized fact table, billion-row analytical query",
          consequence:
            "Joining orders → customers → cities → regions at scan time produces an expensive distributed shuffle. The query runs for an hour or OOMs.",
          de_catches_it:
            "Denormalize the dimensional attributes onto the fact table. Columnar storage makes the repeated values nearly free.",
        },
        {
          scenario: "Denormalized OLTP table accepting transactional writes",
          consequence:
            "When a customer's city changes, you have to update millions of order rows — slow, lock-heavy, and any inconsistency becomes a permanent bug.",
          de_catches_it:
            "Don't denormalize OLTP. The whole point of denormalization is the *immutable* nature of analytical data — it doesn't generalize.",
        },
        {
          scenario: "Denormalized but mutable: \"customer city\" updated retroactively on historical orders",
          consequence:
            "Historical reports change every time a customer moves. Last quarter's \"revenue by city\" silently becomes a different number. Audit trail destroyed.",
          de_catches_it:
            "Freeze denormalized attributes at event time. SCD Type 2 in the dimension; copy the *as-of* value onto the fact row.",
        },
      ],
    },
  },
  {
    concept_slug: "normalization-vs-denormalization",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "When to pick what",
      intro: "Most mature stacks use both — normalized at the integration layer (bronze/silver), denormalized at the consumption layer (gold).",
      items: [
        {
          name: "OLTP workload (many writes, transactional consistency)",
          description: "Stay highly normalized — 3NF or beyond. Update anomalies are the dominant risk.",
        },
        {
          name: "OLAP / BI workload (many reads, complex queries)",
          description: "Denormalize. Joins at scale dominate cost; the redundancy is safe and compresses.",
        },
        {
          name: "Mixed workload",
          description: "Use medallion: bronze/silver normalized for fidelity, gold denormalized for consumption.",
        },
        {
          name: "Real-time event aggregation",
          description: "Denormalize aggressively at ingestion — joining a hot fact stream against a dim is too slow.",
        },
      ],
    },
  },
  {
    concept_slug: "normalization-vs-denormalization",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "Your analytics warehouse has a fact_sales table with a denormalized customer_city column. A customer moves from Providence to Boston. What should happen to their old order rows?",
      options: [
        { id: "a", text: "Update them all to \"Boston\" so the customer record is consistent.", correct: false },
        {
          id: "b",
          text: "Leave them alone. The city is frozen at order time — that's the historical truth. New orders get \"Boston\".",
          correct: true,
        },
        { id: "c", text: "Delete the old orders and re-ingest them.", correct: false },
        { id: "d", text: "Add a new column for `customer_current_city`.", correct: false },
      ],
      explanation:
        "The point of denormalizing the city onto the fact is that analytical data is *append-only history*. The old orders shipped to Providence — that's the actual fact. \"Revenue by city\" should still attribute that revenue to Providence forever. This is exactly why denormalization works in OLAP but would be a disaster in OLTP — analytical data doesn't update.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // dimensional-modeling
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "dimensional-modeling",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Facts vs dimensions",
      left_label: "Fact (the verb)",
      right_label: "Dimension (the noun)",
      pairs: [
        { left: "An event that happened (sale, click, shipment)", right: "Context about an entity (customer, product, store)" },
        { left: "Tall and thin: billions of rows, few columns", right: "Short and wide: thousands of rows, many descriptive columns" },
        { left: "Append-only, immutable", right: "Slowly changing (Type 1/2/3 updates)" },
        { left: "Holds numeric measures (quantity, revenue) + FKs", right: "Holds attributes you filter and group by" },
        { left: "Aggregated with SUM, COUNT, AVG", right: "Joined for context; used in WHERE and GROUP BY" },
      ],
    },
  },
  {
    concept_slug: "dimensional-modeling",
    sort_order: 2,
    type: "dimensions",
    payload: {
      title: "Anatomy of a dimensional model",
      intro: "The pieces and their roles.",
      items: [
        {
          name: "Star schema",
          description: "One fact table in the center, surrounded by its dimensions — each dimension joined directly to the fact via a foreign key. The dominant analytical layout because queries map cleanly onto it.",
          swe_parallel: "An aggregate root with reference data hanging off it",
        },
        {
          name: "Snowflake schema",
          description: "A star where dimensions are further normalized into sub-tables. More joins, mostly out of favor now that storage is cheap.",
        },
        {
          name: "Conformed dimension",
          description: "A single \"customer\" or \"date\" dimension shared across multiple fact tables (sales, support tickets, web sessions). Lets you compare metrics from different business processes directly.",
          swe_parallel: "An interface defined once and reused — DRY for reference data",
        },
        {
          name: "Surrogate key",
          description: "Integer PK that replaces (or supplements) a natural key. Cheap to join on, stable across natural-key changes, and lets SCD Type 2 use a different surrogate key per version.",
        },
        {
          name: "Degenerate dimension",
          description: "A dimension attribute that lives directly on the fact table because it has no other attributes worth a dimension of its own — e.g., `order_id` on `fact_line_item`.",
        },
      ],
    },
  },
  {
    concept_slug: "dimensional-modeling",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "Signs your dimensional model is broken",
      items: [
        {
          scenario: "Two teams have different \"customer\" dimensions with subtly different definitions",
          consequence:
            "Sales and Support both report customer counts that don't match. Every cross-functional review devolves into definition arguments.",
          de_catches_it:
            "Conformed dimensions: define \"customer\" once, share the same dim_customer table across all fact tables.",
        },
        {
          scenario: "A measure (\"customer lifetime value\") shows up as a column on a dimension",
          consequence:
            "It gets stale instantly — LTV changes with every order, but the dimension only updates on customer profile changes.",
          de_catches_it:
            "Measures belong on facts (or are derived from them). Dimensions hold *descriptive* attributes that don't change with every event.",
        },
        {
          scenario: "Fact table has 80 columns and growing",
          consequence:
            "It's actually multiple grains shoved together — \"order header\" mixed with \"line item.\" Aggregations double-count anything not at the smallest grain.",
          de_catches_it:
            "Split into separate fact tables, each at a single declared grain. Or pick the lowest grain and aggregate up.",
        },
      ],
    },
  },
  {
    concept_slug: "dimensional-modeling",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "You're modeling e-commerce data. Which of these belongs on the FACT table vs a DIMENSION table?",
      options: [
        { id: "a", text: "`order_revenue` → dimension; `product_name` → fact", correct: false },
        {
          id: "b",
          text: "`order_revenue` → fact (numeric measure); `product_name` → dimension (descriptive context)",
          correct: true,
        },
        { id: "c", text: "Both belong on the same table — denormalization eliminates the distinction.", correct: false },
        { id: "d", text: "Both belong on dimensions; facts only have IDs.", correct: false },
      ],
      explanation:
        "Numeric measures you'll SUM, AVG, COUNT go on the fact (revenue, quantity, duration). Descriptive attributes you'll filter and GROUP BY go on dimensions (product name, category, customer segment). The Kimball grammar — `SUM(facts) GROUP BY dimensions` — only works if you keep the split clean.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // grain-is-everything
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "grain-is-everything",
    sort_order: 1,
    type: "failure_catalog",
    payload: {
      title: "Grain mistakes that silently corrupt every aggregation",
      items: [
        {
          scenario: "Analyst assumes one row per order; table is actually one row per line item",
          consequence:
            "COUNT(*) and SUM(revenue) inflated by average lines-per-order (~3×). Every \"daily orders\" dashboard is wrong; nothing errors.",
          de_catches_it:
            "Uniqueness test on the assumed grain key. Declare the grain in a comment at the top of the model.",
        },
        {
          scenario: "Fact table mixes order-level and shipment-level rows (\"one row per order, OR one row per shipment if there are multiple shipments\")",
          consequence:
            "Orders with split shipments are double-counted; orders with single shipments are correctly counted. No consistent multiplier; analysts can't even apply a correction factor.",
          de_catches_it:
            "Split into two fact tables, each at a single grain. Resist the urge to \"combine for convenience.\"",
        },
        {
          scenario: "\"Daily snapshot\" fact table with no enforced uniqueness on (account_id, date)",
          consequence:
            "Late reprocessing inserts a duplicate row for some days. The snapshot shows two values for the same day; metrics double-count.",
          de_catches_it:
            "Uniqueness constraint or post-load test on the declared grain key. Idempotent loads (MERGE on grain key, not INSERT).",
        },
        {
          scenario: "Fact table joins to a dimension at the wrong grain, fanning out one-to-many",
          consequence:
            "Pre-join row count: 1M. Post-join: 4M. Every downstream SUM is multiplied by the fanout factor.",
          de_catches_it:
            "Row-count assertion immediately after each join. Cardinality test on the join key in the dimension.",
        },
      ],
    },
  },
  {
    concept_slug: "grain-is-everything",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "Explicit vs implicit grain",
      left_label: "Implicit (the bug factory)",
      right_label: "Explicit (the defensive default)",
      pairs: [
        {
          left: "\"fact_orders\" — but is it one row per order? per line item? per shipment?",
          right: "Comment at top of model: \"Grain: one row per order line item.\"",
        },
        {
          left: "No uniqueness constraint or test on any column combination",
          right: "Uniqueness test on the natural key for the declared grain",
        },
        {
          left: "Analysts discover the grain by running queries and being surprised",
          right: "Grain is in the table doc, the dbt model, and the data catalog",
        },
        {
          left: "Joins to dimensions might fan out — no one knows in advance",
          right: "Cardinality of each join verified at load time",
        },
      ],
    },
  },
  {
    concept_slug: "grain-is-everything",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "Three common fact-table grain types",
      intro: "Most fact tables are one of these three shapes. Pick before you write the first column.",
      items: [
        {
          name: "Transactional",
          description: "One row per discrete event (sale, click, payment). Append-only. Highest volume, most common shape.",
        },
        {
          name: "Periodic snapshot",
          description: "One row per (entity, time period) — e.g., daily account balance. Captures state at regular intervals even when nothing happens.",
        },
        {
          name: "Accumulating snapshot",
          description: "One row per long-running process (e.g., one row per loan application, updated as it moves through stages). Mutable in a controlled way — rare in pure dimensional modeling.",
        },
      ],
    },
  },
  {
    concept_slug: "grain-is-everything",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "Your team is building `fact_sales`. The team lead says \"one row per customer per month, summarizing their orders.\" Which grain type is that, and what's the *first* test you should add?",
      options: [
        { id: "a", text: "Transactional grain; test that `order_id` is unique.", correct: false },
        {
          id: "b",
          text: "Periodic snapshot grain; test that `(customer_id, month)` is unique.",
          correct: true,
        },
        { id: "c", text: "Accumulating snapshot grain; test that `customer_id` is unique.", correct: false },
        { id: "d", text: "Grain doesn't matter; just sum the revenue.", correct: false },
      ],
      explanation:
        "\"One row per customer per month\" is a periodic snapshot (state at a regular interval). The natural key for the declared grain is `(customer_id, month)` — and the first test is uniqueness on that combination. If it's not unique, your monthly totals double-count whenever the load runs twice. Declaring the grain and asserting it is the whole defense.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // slowly-changing-dimensions
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "slowly-changing-dimensions",
    sort_order: 1,
    type: "dimensions",
    payload: {
      title: "The SCD types — what each one does to history",
      intro: "Types 1 and 2 are nearly all of practice. 3 and 6 exist; learn them later.",
      items: [
        {
          name: "Type 1 — Overwrite",
          description: "Replace the old value in place. History is gone. Fine for correcting typos where the past doesn't matter.",
          swe_parallel: "Git force-push: history overwritten, no audit trail",
        },
        {
          name: "Type 2 — Insert new version",
          description: "Expire the old row (set `valid_to`), insert a new row with a new surrogate key, `valid_from = now()`, `valid_to = NULL`, `is_current = true`. Old versions stay queryable.",
          swe_parallel: "Git commit: old version stays, new version added, surrogate key = commit hash",
        },
        {
          name: "Type 3 — Previous value column",
          description: "Add a \"previous_X\" column alongside the current one. Only the most recent change is tracked. Rare in practice.",
        },
        {
          name: "Type 6 — Hybrid",
          description: "Combination of 1, 2, and 3. Keeps versioned history AND a current-value column on the fact. Useful when you need both as-of and current attribution.",
        },
      ],
    },
  },
  {
    concept_slug: "slowly-changing-dimensions",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "App database vs SCD Type 2",
      left_label: "App database (mutable, present-tense)",
      right_label: "SCD Type 2 (immutable, historical)",
      pairs: [
        { left: "`UPDATE customer SET city = 'Boston' WHERE id = 100`", right: "Mark old row `valid_to = now()`; INSERT new row with new surrogate key" },
        { left: "Answers: \"what is true now?\"", right: "Answers: \"what was true on date X?\"" },
        { left: "Foreign keys point to the live row", right: "Foreign keys (in fact rows) point to a specific version of the row" },
        { left: "Old value is gone after the update", right: "Old version stays queryable forever" },
        { left: "Reports always reflect current attributes", right: "Reports reflect attributes as-of the event date" },
      ],
    },
  },
  {
    concept_slug: "slowly-changing-dimensions",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "What Type 1 (overwrite) silently destroys",
      items: [
        {
          scenario: "Sales rep is promoted from \"Junior\" to \"Senior\" — Type 1 overwrite of `dim_employee.title`",
          consequence:
            "Last year's sales reports now show all their previous-year wins under the new title. \"Junior rep performance trend\" silently changes.",
          de_catches_it:
            "Type 2: keep the old version with `valid_to`. Fact rows from when they were Junior reference the Junior version.",
        },
        {
          scenario: "Product is recategorized from \"Beverages\" to \"Snacks\" — Type 1 overwrite",
          consequence:
            "Historical \"Beverages revenue\" drops as those sales now count toward \"Snacks.\" Looks like a sudden business shift; it's a categorization change.",
          de_catches_it:
            "Type 2: the category in effect at the time of sale is preserved. Year-over-year comparisons stay meaningful.",
        },
        {
          scenario: "Customer's account manager changes mid-quarter — Type 1 overwrite",
          consequence:
            "Old account manager loses credit for deals they closed in earlier quarters. Compensation calculations break retroactively.",
          de_catches_it:
            "Type 2: each deal's fact row points to the account manager assigned at the time. Compensation reports stay accurate.",
        },
      ],
    },
  },
  {
    concept_slug: "slowly-changing-dimensions",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "An analyst asks: \"why does the revenue for a year-ago customer's home state change every time they relocate?\" What's the underlying issue?",
      options: [
        { id: "a", text: "The fact table is querying the wrong measure column.", correct: false },
        {
          id: "b",
          text: "The dimension is using SCD Type 1 (overwrite), so old fact rows resolve the customer's state through the dimension's *current* state — not the state at order time. Need Type 2.",
          correct: true,
        },
        { id: "c", text: "The dimension was deleted and rebuilt.", correct: false },
        { id: "d", text: "The OLAP engine isn't compressing the column correctly.", correct: false },
      ],
      explanation:
        "Classic Type 1 bug. When historical orders join through a Type 1 dimension, they always pick up the *current* attribute value, not the one in effect at the time. The fix is Type 2: keep every version, and the fact row's foreign key points to the surrogate key of the version that was current when the event happened. This is how analytical models achieve point-in-time correctness.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // oltp-vs-olap
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "oltp-vs-olap",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Row storage vs column storage",
      left_label: "OLTP (row-oriented)",
      right_label: "OLAP (column-oriented)",
      pairs: [
        { left: "Each row's fields stored contiguously (array-of-structs)", right: "Each column stored contiguously, often as its own file (struct-of-arrays)" },
        { left: "Fast for: `SELECT * WHERE id = 123`", right: "Fast for: `SELECT SUM(revenue) GROUP BY region`" },
        { left: "Reads must drag all 50 fields off disk per matching row", right: "Reads pull only the 2 columns the query touches" },
        { left: "ACID transactions, indexes for point lookups", right: "Append-mostly, partitioning + clustering for pruning" },
        { left: "Postgres, MySQL, Oracle, SQL Server", right: "Snowflake, BigQuery, ClickHouse, DuckDB, Redshift" },
      ],
    },
  },
  {
    concept_slug: "oltp-vs-olap",
    sort_order: 2,
    type: "dimensions",
    payload: {
      title: "Why columnar wins for analytics — three compounding reasons",
      intro: "Each reason alone is significant. Together they produce orders of magnitude.",
      items: [
        {
          name: "Read only the columns you need",
          description: "A query touching 2 of 50 columns reads ~4% of the table's bytes. Row storage would scan all 50 fields per row just to discard 48.",
        },
        {
          name: "Compression on homogeneous data",
          description: "A single column is one type, often low cardinality and often sorted. Run-length and dictionary encoding shrink it dramatically — sometimes 10–50× smaller on disk than the equivalent row layout.",
        },
        {
          name: "Vectorized / SIMD execution",
          description: "A contiguous column is perfect for SIMD instructions — the CPU can sum a chunk of values per cycle instead of one. Modern OLAP engines exploit this end-to-end.",
        },
      ],
    },
  },
  {
    concept_slug: "oltp-vs-olap",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "Wrong-engine-for-workload disasters",
      items: [
        {
          scenario: "Running an analytical dashboard against the production OLTP database",
          consequence:
            "Long-running scans contend with transactional locks. Latency for real users spikes. Engineers blame \"slow Postgres\" when the workload is mismatched.",
          de_catches_it:
            "Replicate to an OLAP warehouse. The analytical workload doesn't belong on row storage; the OLTP workload doesn't belong on columnar storage.",
        },
        {
          scenario: "Doing single-row UPDATEs against a columnar warehouse table",
          consequence:
            "Each UPDATE touches every column's file. Operations that take milliseconds in OLTP take minutes in OLAP. The team thinks the warehouse is \"slow.\"",
          de_catches_it:
            "Warehouses are append-mostly by design. Use MERGE on batch loads; don't trickle individual UPDATEs.",
        },
        {
          scenario: "SELECT * across a billion-row columnar table",
          consequence:
            "You've defeated the whole point of columnar — pulling every column's file off disk and reassembling rows. The query runs 50× slower than it would on a relevant subset.",
          de_catches_it:
            "Always project only the columns you need. `SELECT *` is an OLTP habit that ruins OLAP performance.",
        },
      ],
    },
  },
  {
    concept_slug: "oltp-vs-olap",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "You're picking a database for two workloads: (A) a customer-facing API that does point-lookups by user_id and writes a few rows per request; (B) an analytics dashboard that aggregates billions of clickstream events. Which assignment is right?",
      options: [
        { id: "a", text: "Both on Postgres — fewer moving parts.", correct: false },
        { id: "b", text: "Both on Snowflake — modern is better.", correct: false },
        {
          id: "c",
          text: "(A) on Postgres (row-oriented, ACID, indexed point lookups). (B) on Snowflake/BigQuery/DuckDB (column-oriented, columnar scans, vectorized).",
          correct: true,
        },
        { id: "d", text: "(A) on DuckDB; (B) on MySQL.", correct: false },
      ],
      explanation:
        "OLTP workloads (small concurrent transactions, point lookups) belong on row-oriented databases — Postgres, MySQL. OLAP workloads (huge scans, aggregations across many rows) belong on column-oriented warehouses — Snowflake, BigQuery, ClickHouse, DuckDB. Picking the right engine for the workload is one of the highest-leverage architectural decisions in DE — the order-of-magnitude wins come from the storage layout matching the query pattern.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // medallion-architecture
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "medallion-architecture",
    sort_order: 1,
    type: "dimensions",
    payload: {
      title: "The three layers and what each one owns",
      intro: "Each layer has one job and a clear contract with the next.",
      items: [
        {
          name: "Bronze",
          description: "Raw, immutable, append-only. Whatever the source threw at you, captured untouched. Source of truth for replay.",
          swe_parallel: "Raw input / adapter layer (the JSON the API returned, exactly as it arrived)",
        },
        {
          name: "Silver",
          description: "Cleaned, typed, deduplicated, conformed. SCD Type 2 lives here. Validated and queryable as a canonical domain model.",
          swe_parallel: "Domain / business-logic layer (the cleansed entities your business reasons about)",
        },
        {
          name: "Gold",
          description: "Business-level product — fact and dimension tables, pre-aggregated metrics, materialized views. What dashboards and ML features actually consume.",
          swe_parallel: "Presentation / API layer (the endpoints consumers integrate against)",
        },
      ],
    },
  },
  {
    concept_slug: "medallion-architecture",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "SWE layered architecture ↔ DE medallion",
      left_label: "SWE app",
      right_label: "DE pipeline",
      pairs: [
        { left: "Raw HTTP input, deserialized to DTOs", right: "Bronze: raw events landed as-is" },
        { left: "Domain models, validated and consistent", right: "Silver: cleansed canonical models, SCD applied" },
        { left: "API responses / view models", right: "Gold: fact tables, dimensional models, aggregates" },
        { left: "Each layer has one responsibility", right: "Each layer has one responsibility" },
        { left: "Lower layers don't know about upper layers", right: "Bronze doesn't know about silver or gold" },
        { left: "You can swap presentation without touching the domain", right: "You can rebuild silver and gold from bronze when logic changes" },
      ],
    },
  },
  {
    concept_slug: "medallion-architecture",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "Common medallion violations",
      items: [
        {
          scenario: "Mutating the bronze layer to \"clean up\" obviously-wrong rows",
          consequence:
            "You've destroyed the source of truth. The next time you need to reproduce a historical report, you can't — bronze no longer reflects what the upstream actually sent.",
          de_catches_it:
            "Bronze is immutable. Filter or correct in silver, where the cleaning rules are visible and reversible.",
        },
        {
          scenario: "Dashboards query silver directly, skipping gold",
          consequence:
            "Each dashboard duplicates the same aggregation logic. Metrics drift between dashboards over time. Performance is slower than it needs to be.",
          de_catches_it:
            "Gold is the consumption contract. Pre-aggregate there; dashboards become thin and consistent.",
        },
        {
          scenario: "Silver is rebuilt by reading from another silver table (cross-layer reference)",
          consequence:
            "Circular dependency. Recalculating one silver table requires another silver table that depended on the first. Builds become brittle and order-dependent.",
          de_catches_it:
            "Layers only reference downward (silver reads from bronze, gold reads from silver). No upward or sideways references between layers.",
        },
        {
          scenario: "Bug in silver-layer dedup logic. You write a one-off UPDATE script to fix gold directly.",
          consequence:
            "You've broken the reproducibility chain. Re-running the pipeline doesn't reach the same end state — gold now depends on a script no one tracks.",
          de_catches_it:
            "Fix silver, then rebuild gold from silver. The whole point of the layering is that you *can* do this.",
        },
      ],
    },
  },
  {
    concept_slug: "medallion-architecture",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "You discover that your silver-layer customer deduplication logic has been wrong for 3 months — duplicates are being kept instead of merged. The bug is in the silver SQL. What's the medallion-correct recovery?",
      options: [
        { id: "a", text: "Write an UPDATE script that fixes the affected silver and gold rows in place.", correct: false },
        {
          id: "b",
          text: "Fix the silver SQL; drop and rebuild silver and gold for the affected 3-month window from the immutable bronze layer.",
          correct: true,
        },
        { id: "c", text: "Re-ingest the source data from the API for the affected period.", correct: false },
        { id: "d", text: "Add a footnote to the affected dashboards and move on.", correct: false },
      ],
      explanation:
        "The reason bronze is kept immutable and append-only is *exactly* this: silver and gold are derived, so they're rebuildable. Fix the silver code, drop and rebuild silver from bronze, drop and rebuild gold from silver. No source re-ingestion needed (bronze still has the truth); no in-place patching needed (which would break reproducibility). This is the layered-architecture payoff applied to data.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // data-vault
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "data-vault",
    sort_order: 1,
    type: "dimensions",
    payload: {
      title: "The three Data Vault primitives",
      intro: "Everything in a Data Vault model decomposes into one of these three shapes.",
      items: [
        {
          name: "Hub",
          description: "Stable business keys — the durable identity of a concept. `hub_customer` holds `customer_id` and the timestamp it first appeared. Few columns, append-only.",
          swe_parallel: "Aggregate root — the stable identity of an entity",
        },
        {
          name: "Link",
          description: "Relationships between hubs. `link_customer_order` records that a customer placed an order, with timestamps. Append-only; relationships never get \"updated.\"",
          swe_parallel: "Association table in a many-to-many relationship",
        },
        {
          name: "Satellite",
          description: "Descriptive attributes plus their full timestamped history. `sat_customer_address` holds address, city, state, with `load_ts` per version. Append-only — every change is a new row.",
          swe_parallel: "Versioned, append-only attribute bag — event sourcing for descriptive data",
        },
      ],
    },
  },
  {
    concept_slug: "data-vault",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "Data Vault vs dimensional modeling — different layers, different jobs",
      left_label: "Data Vault (integration layer)",
      right_label: "Dimensional (consumption layer)",
      pairs: [
        { left: "Optimizes for integration, history, adaptability", right: "Optimizes for consumption and query ergonomics" },
        { left: "Highly normalized; hubs / links / satellites", right: "Denormalized; facts surrounded by dimensions" },
        { left: "Insert-only; every attribute change is a new row", right: "SCD Type 2 dimensions; new versions inserted, old expired" },
        { left: "Adding a new source means adding a new hub or satellite", right: "Adding a new source often means reshaping the star schema" },
        { left: "Hard to query directly; analysts won't write SQL against it", right: "Built for analysts; queries map to business questions" },
        { left: "Often sits underneath dimensional, as the integration tier", right: "Often built on top of Data Vault for user consumption" },
      ],
    },
  },
  {
    concept_slug: "data-vault",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "When Data Vault is the wrong tool",
      items: [
        {
          scenario: "Small team, 2 source systems, simple business model",
          consequence:
            "Data Vault adds significant upfront modeling complexity. Hubs, links, satellites for everything multiplies the number of tables 3–5×. Queries become unwieldy.",
          de_catches_it:
            "Use straight dimensional modeling (or even just denormalized wide tables) until the source-system complexity actually demands the abstraction.",
        },
        {
          scenario: "Team exposes Data Vault tables directly to analysts",
          consequence:
            "Analysts have to join 4–6 hubs/links/sats to answer a question that would be one join in a star schema. Productivity craters; they start building shadow copies.",
          de_catches_it:
            "Vault is an integration tier, not a consumption tier. Build a dimensional layer on top; analysts query the stars.",
        },
        {
          scenario: "Satellites updated in place instead of insert-only",
          consequence:
            "You've destroyed the audit trail Data Vault exists to provide. Every change to a descriptive attribute used to be a new row; now they're being overwritten.",
          de_catches_it:
            "Satellites are append-only by definition. Every attribute change is a new row with a new `load_ts`. The previous row stays.",
        },
      ],
    },
  },
  {
    concept_slug: "data-vault",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "You're modeling customer data in Data Vault. The customer's `customer_id` is the business key; their `address` changes occasionally; they place many `orders`. How do you decompose this?",
      options: [
        { id: "a", text: "One table per entity — `customer`, `address`, `order` — with foreign keys.", correct: false },
        {
          id: "b",
          text: "`hub_customer` (customer_id), `sat_customer_address` (address history, append-only), `hub_order` (order_id), `link_customer_order` (customer_id ↔ order_id).",
          correct: true,
        },
        { id: "c", text: "A single denormalized fact table with customer attributes baked in.", correct: false },
        { id: "d", text: "A star schema with `dim_customer` (SCD Type 2) and `fact_orders`.", correct: false },
      ],
      explanation:
        "Data Vault breaks each concept into its three primitives. Stable identity → hub (`hub_customer`, `hub_order`). Relationship → link (`link_customer_order`). Versioned attributes → satellite (`sat_customer_address` — every address change is a new row). This is the integration-layer model. To make it queryable for analysts, you'd build a star schema *on top* — that's option (d), which is the consumption-layer model. Both can coexist in a mature warehouse.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // etl-vs-elt
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "etl-vs-elt",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Where compute lives — ETL vs ELT",
      left_label: "ETL (transform before load)",
      right_label: "ELT (load raw, transform in place)",
      pairs: [
        { left: "Dedicated processing tier (Spark cluster, ETL server)", right: "Warehouse-native compute (Snowflake, BigQuery)" },
        { left: "Raw data is often discarded after transform", right: "Raw data is the source of truth (bronze layer)" },
        { left: "Bug in transform → potentially re-extract from source", right: "Bug in transform → re-derive from raw with corrected SQL" },
        { left: "PII / sensitive fields can be masked before landing", right: "All fields land first; masking happens in the warehouse" },
        { left: "Wins for heavy procedural transforms SQL can't express", right: "Wins for set-based relational work (the 80% case)" },
      ],
    },
  },
  {
    concept_slug: "etl-vs-elt",
    sort_order: 2,
    type: "failure_catalog",
    payload: {
      title: "Failure modes specific to each pattern",
      items: [
        {
          scenario: "ETL pipeline transforms data, loads to warehouse, then deletes raw extract. Three months later you find a logic bug.",
          consequence:
            "You can't re-derive the correct data — the raw is gone. Either re-extract from a source that may have moved on, or live with the bug.",
          de_catches_it:
            "Don't discard raw. ELT lands it permanently; ETL can still keep a raw archive separately. Bronze is your reproducibility insurance.",
        },
        {
          scenario: "ELT pipeline lands raw rows including PII to the warehouse, then transforms/masks downstream.",
          consequence:
            "Compliance violation if PII is supposed to never enter the warehouse. Even if you mask it later, the raw rows existed there for some window.",
          de_catches_it:
            "ETL or hybrid: transform/mask sensitive fields *before* they land. For non-sensitive fields, ELT is fine.",
        },
        {
          scenario: "Team tries to do complex Python ML feature engineering in dbt SQL because \"we're an ELT shop.\"",
          consequence:
            "SQL becomes a 500-line mess of nested CTEs reimplementing string parsing and array logic that Python would handle in 5 lines.",
          de_catches_it:
            "Mix patterns. Drop to Spark/Python for the heavy procedural step; land the result; let dbt SQL handle the modeling layer downstream.",
        },
      ],
    },
  },
  {
    concept_slug: "etl-vs-elt",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "Picking the right pattern",
      intro: "Most mature stacks use both. The question is where each one fits.",
      items: [
        {
          name: "ELT (warehouse-native)",
          description: "Set-based SQL transforms, joins, aggregations — the 80% case. dbt + Snowflake/BigQuery/DuckDB.",
        },
        {
          name: "ETL (preload transformation)",
          description: "Compliance/PII handling, heavy procedural logic, unstructured data parsing, ML feature engineering. Spark, Flink, or custom Python.",
        },
        {
          name: "Hybrid",
          description: "ETL for ingestion + light cleanup; ELT for everything from bronze onward. The common real-world shape.",
        },
        {
          name: "Streaming ELT",
          description: "Events land on a stream (Kafka), get materialized into the warehouse continuously, transform there. Snowflake streams + tasks, or BigQuery scheduled queries.",
        },
      ],
    },
  },
  {
    concept_slug: "etl-vs-elt",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "Your team needs to bring in Salesforce data, mask credit card numbers (compliance requirement), then build dimensional models on the rest. What's the cleanest pipeline shape?",
      options: [
        { id: "a", text: "Pure ELT — land everything raw including credit cards, mask downstream in dbt.", correct: false },
        {
          id: "b",
          text: "Hybrid — ETL the masking step (strip credit cards before landing), then ELT in the warehouse for everything else (dbt).",
          correct: true,
        },
        { id: "c", text: "Pure ETL — Spark for everything, write only the final masked + modeled tables to the warehouse.", correct: false },
        { id: "d", text: "Don't bring in the data at all — too risky.", correct: false },
      ],
      explanation:
        "Sensitive fields like credit card numbers shouldn't land in the warehouse raw — most compliance regimes (PCI DSS, GDPR) treat data residence as the bar, not what happens downstream. Strip or mask before landing (ETL). Everything else can land raw and transform in-warehouse (ELT). This hybrid is the common real-world shape: ETL for the small set of sensitive things; ELT for the bulk.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // idempotency
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "idempotency",
    sort_order: 1,
    type: "dimensions",
    payload: {
      title: "Concrete idempotency patterns",
      intro: "How you actually achieve \"same result no matter how many times this runs.\"",
      items: [
        {
          name: "MERGE on natural key",
          description: "`MERGE INTO target USING staging ON key = key WHEN MATCHED UPDATE ... WHEN NOT MATCHED INSERT`. New rows insert; existing rows update; reruns are safe.",
          swe_parallel: "PUT semantics — same body, same end state",
        },
        {
          name: "Partition overwrite",
          description: "Daily job writes to `date='2026-06-01'` partition; rerun does `DELETE WHERE date='2026-06-01'; INSERT ...`. The cleanest idempotency primitive in batch.",
          swe_parallel: "Idempotent file write — overwrite the named blob",
        },
        {
          name: "Atomic table swap",
          description: "Build a `new_table`; rename it into place at the end. All-or-nothing; readers always see a consistent snapshot.",
          swe_parallel: "Blue-green deploy",
        },
        {
          name: "Hash-based dedup",
          description: "Compute a deterministic hash per row; insert only if the hash hasn't been seen. Works when natural keys aren't available.",
          swe_parallel: "Idempotency keys on payment APIs",
        },
      ],
    },
  },
  {
    concept_slug: "idempotency",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "Imperative append vs declarative end-state",
      left_label: "SWE habit (imperative)",
      right_label: "DE discipline (declarative end-state)",
      pairs: [
        { left: "INSERT a row when this event arrives", right: "MERGE so the end state matches; idempotent reruns" },
        { left: "Rely on processing order", right: "Operations order-independent, or use deterministic ordering keys" },
        { left: "Bake `now()` into the row body", right: "Use deterministic timestamps from the source event" },
        { left: "Random IDs / seeds generated per run", right: "Deterministic IDs from a hash of stable inputs" },
        { left: "Backfill = surgical row updates and prayer", right: "Backfill = re-run the partition; same end state" },
      ],
    },
  },
  {
    concept_slug: "idempotency",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "What non-idempotent transforms produce when re-run",
      items: [
        {
          scenario: "Pipeline appends to a fact table. Orchestrator retries after a transient failure.",
          consequence:
            "Rows from the first (partial) run are now duplicated by the second run. Every `SUM` for that partition is inflated. No error.",
          de_catches_it: "MERGE on the natural key; or partition overwrite for the affected window.",
        },
        {
          scenario: "Row body includes `processed_at = now()`. Rerun stamps a new `processed_at`.",
          consequence:
            "Reruns produce *different* data. Downstream joins on `processed_at` fail to match between runs.",
          de_catches_it: "Use the *event's* timestamp from the source, not the processing time. If you need processing time, store it in a separate column that's not part of the row's identity.",
        },
        {
          scenario: "Transform uses a window function with `ORDER BY (no column)` — non-deterministic ordering across runs.",
          consequence: "Same input data produces different outputs on each run. Downstream tests randomly fail.",
          de_catches_it: "Always `ORDER BY` a deterministic key (event_id, source_timestamp + tiebreaker). Determinism is non-negotiable.",
        },
        {
          scenario: "Transform calls `SELECT random_uuid()` for surrogate keys.",
          consequence:
            "Every rerun assigns different surrogate keys to the same logical rows. Downstream tables joining on those keys break.",
          de_catches_it: "Generate surrogate keys deterministically from a hash of stable input columns: `md5(concat(natural_key, source_timestamp))`.",
        },
      ],
    },
  },
  {
    concept_slug: "idempotency",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "A daily pipeline writes summary rows for yesterday. The orchestrator retries after a partial failure. Which write strategy guarantees the second run produces the same final table as a single successful run?",
      options: [
        { id: "a", text: "`INSERT INTO summary SELECT ...` (append).", correct: false },
        {
          id: "b",
          text: "`DELETE FROM summary WHERE date = yesterday; INSERT INTO summary SELECT ...` — partition overwrite.",
          correct: true,
        },
        { id: "c", text: "`INSERT INTO summary SELECT ...` followed by manually removing duplicates after the run.", correct: false },
        { id: "d", text: "`INSERT INTO summary VALUES (...) ON CONFLICT DO NOTHING` (silently skip duplicates).", correct: false },
      ],
      explanation:
        "Partition overwrite (`DELETE WHERE partition_key = X; INSERT ...`) is the cleanest batch idempotency primitive. Append double-counts on retry; ON CONFLICT DO NOTHING leaves the first partial write's incomplete rows in place. MERGE on a stable key is the other valid option. The shared property: same input → same end state regardless of how many times the job runs.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // incremental-vs-full-loads
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "incremental-vs-full-loads",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Full vs incremental — the trade space",
      left_label: "Full load",
      right_label: "Incremental load",
      pairs: [
        { left: "Reprocess everything every run", right: "Process only what changed since last run" },
        { left: "Trivially idempotent — each run is authoritative", right: "Requires careful idempotency on the delta" },
        { left: "Self-healing — drift impossible", right: "Vulnerable to silent drift; needs reconciliation" },
        { left: "Cost scales with total data size", right: "Cost scales with the delta — cheap at scale" },
        { left: "Simple to reason about and debug", right: "Watermark logic + edge cases (late updates, deletes) add real complexity" },
        { left: "git clone — start fresh every time", right: "git pull — fetch only new commits since a known ref" },
      ],
    },
  },
  {
    concept_slug: "incremental-vs-full-loads",
    sort_order: 2,
    type: "failure_catalog",
    payload: {
      title: "Silent drift — incremental loads going wrong without errors",
      items: [
        {
          scenario: "Source row is hard-deleted. Watermark query `WHERE updated_at > :last_watermark` never sees deletes.",
          consequence:
            "The deleted row stays in your incremental copy forever. Counts and aggregations include rows that no longer exist in the source.",
          de_catches_it:
            "Periodic full-reload reconciliation; or CDC to capture deletes from the WAL.",
        },
        {
          scenario: "Source row was updated 2 hours ago, but the row's `updated_at` somehow stayed at its original timestamp (bug in source app).",
          consequence:
            "Incremental query never sees the update. Your warehouse has stale values; the dashboards built on it lie.",
          de_catches_it: "Reconcile against source periodically (full reload monthly); or CDC.",
        },
        {
          scenario: "Watermark is set to `last_run_timestamp`, but the source has rows with timestamps from after `last_run` that arrived before `last_run` (clock skew).",
          consequence:
            "Late-arriving rows are silently skipped. Worse — if the clock corrects on the next run, you might or might not catch them.",
          de_catches_it: "Watermark with overlap window (re-pull last 10 minutes every run, dedup); or CDC where event order matches WAL order.",
        },
        {
          scenario: "Team deploys a code change that retroactively recategorizes rows. The source updates 50M rows in one transaction. Watermark catches the timestamps fine — but the warehouse incremental table is much larger now.",
          consequence:
            "Suddenly your incremental load processes 50M rows instead of the usual 50K. Pipeline takes 100× longer. Maybe times out.",
          de_catches_it: "Alert on delta size vs trailing average. Recategorizations should be planned events with explicit handling.",
        },
      ],
    },
  },
  {
    concept_slug: "incremental-vs-full-loads",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "Types of source changes you need to capture",
      intro: "Naive incremental loads (`WHERE updated_at > :watermark`) handle the first two well and the rest poorly. CDC handles all of them.",
      items: [
        { name: "Inserts", description: "New rows with `updated_at` greater than the watermark. Easy — incremental loads catch these by definition." },
        { name: "Updates (timely)", description: "Existing row mutated; `updated_at` reflects the change. Naive incremental catches these if the watermark is current." },
        { name: "Updates (late or out-of-order)", description: "`updated_at` mysteriously below the watermark. Naive incremental misses entirely; CDC sees them." },
        { name: "Hard deletes", description: "Row removed from source. No `updated_at` for the now-gone row to exceed the watermark. Naive incremental can't see deletes; CDC streams them as events." },
        { name: "Soft deletes (`deleted_at` populated)", description: "Row stays but marked deleted. Naive incremental can catch these if the soft-delete update bumps `updated_at`." },
      ],
    },
  },
  {
    concept_slug: "incremental-vs-full-loads",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "A 50 TB fact table grows ~50 GB per day. Your team has been running a nightly full reload (`CREATE OR REPLACE TABLE AS SELECT ...`). The reload now takes 8 hours and is missing the morning SLA. What's the move?",
      options: [
        { id: "a", text: "Buy a bigger warehouse.", correct: false },
        {
          id: "b",
          text: "Move to incremental load (process only the day's 50 GB). Add a periodic full-reload reconciliation (weekly or monthly) to heal any drift.",
          correct: true,
        },
        { id: "c", text: "Run the full reload less often (every 3 days instead of daily).", correct: false },
        { id: "d", text: "Drop historical rows older than a year to shrink the table.", correct: false },
      ],
      explanation:
        "At 50 TB, full reloads stop scaling. Incremental (process the 50 GB delta) is the natural answer — 1000× cheaper and faster. Add periodic full-reload reconciliation to heal drift from missed updates/deletes, or go to CDC for full coverage. Common pattern: small dims as full loads, giant facts as incremental.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // change-data-capture
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "change-data-capture",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Naive watermarking vs CDC",
      left_label: "Watermark-based incremental",
      right_label: "Change Data Capture",
      pairs: [
        { left: "`WHERE updated_at > :watermark` query on the source", right: "Reads source's write-ahead log (WAL / binlog / oplog) directly" },
        { left: "Catches inserts and timely updates", right: "Catches inserts, updates, and **deletes**, in commit order" },
        { left: "Misses hard deletes (deleted rows have no `updated_at`)", right: "Sees every change the database commits" },
        { left: "Misses out-of-order or late updates if timestamps drift", right: "Order matches WAL commit order, not wall clock" },
        { left: "Polling pattern (every N minutes)", right: "Streaming pattern (continuous)" },
        { left: "No coordination with source DBA required", right: "Source DBA must enable replication / grant WAL access" },
      ],
    },
  },
  {
    concept_slug: "change-data-capture",
    sort_order: 2,
    type: "dimensions",
    payload: {
      title: "CDC mechanisms",
      intro: "Different ways to capture changes, with different cost/fidelity trade-offs.",
      items: [
        {
          name: "Log-based CDC (the gold standard)",
          description: "Tail the database's WAL / binlog / oplog directly. Captures every commit in order. Lowest source-system impact, highest fidelity.",
          swe_parallel: "Subscribing to the database's existing internal replication stream",
        },
        {
          name: "Trigger-based CDC",
          description: "Database triggers write to a change-log table on every insert/update/delete. Higher overhead on source writes; not always feasible.",
        },
        {
          name: "Query-based CDC (watermarking)",
          description: "Periodic `WHERE updated_at > :watermark` polling. Simplest to implement; misses deletes and late updates. The naive approach.",
        },
        {
          name: "Snapshot + log-tail (hybrid)",
          description: "Initial bulk snapshot of the source table; from then on, tail the WAL. Most production CDC tools (Debezium, Fivetran) do this.",
        },
      ],
    },
  },
  {
    concept_slug: "change-data-capture",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "What CDC catches that polling can't",
      items: [
        {
          scenario: "A customer's GDPR \"right to be forgotten\" request triggers a hard delete on the source.",
          consequence:
            "Naive watermark polling never sees deletes. The customer's data remains in the warehouse — GDPR violation. CDC captures the delete event as part of the WAL.",
          de_catches_it: "CDC propagates the delete to the warehouse; downstream models drop or anonymize the corresponding rows.",
        },
        {
          scenario: "Application bug means some rows have `updated_at` permanently stuck at their creation time.",
          consequence:
            "Naive watermarking sees those rows once (at creation) and never again. Updates are missed silently.",
          de_catches_it: "CDC sees every commit regardless of what columns the application updates.",
        },
        {
          scenario: "Source DB undergoes a large migration: 50M rows updated in a single transaction.",
          consequence:
            "Naive watermark catches all 50M rows in one polling cycle — pipeline times out or OOMs. CDC streams them at the commit rate; downstream applies them incrementally.",
          de_catches_it: "CDC's streaming nature spreads the load; throttling and back-pressure handle the burst.",
        },
      ],
    },
  },
  {
    concept_slug: "change-data-capture",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "Compliance requires that customer deletes propagate to the warehouse within 24 hours. The source is Postgres. Your nightly incremental load uses `WHERE updated_at > :watermark`. Does it satisfy the requirement?",
      options: [
        { id: "a", text: "Yes — nightly runs are well within 24 hours.", correct: false },
        {
          id: "b",
          text: "No — `WHERE updated_at > :watermark` queries can't observe hard deletes at all. The customer's data would stay in the warehouse indefinitely. You need CDC (e.g., Debezium tailing the Postgres WAL).",
          correct: true,
        },
        { id: "c", text: "Yes — Postgres always updates `updated_at` on delete.", correct: false },
        { id: "d", text: "No — but adding a `deleted_at` column to every source table would fix it.", correct: false },
      ],
      explanation:
        "Hard deletes simply remove the row. A query that filters `WHERE updated_at > :watermark` has no row to consider — the row no longer exists. Naive watermarking is structurally blind to deletes. The fixes are either CDC (the gold standard: tail the WAL, capture the DELETE event) or moving the source to soft deletes (mark a `deleted_at` column instead of removing the row). For an existing Postgres source, Debezium reading the logical replication slot is the standard answer.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // data-quality-as-tests
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "data-quality-as-tests",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "SWE testing vs DE testing — what's the variable",
      left_label: "Software testing",
      right_label: "Data quality testing",
      pairs: [
        { left: "Code is the variable; test data is fixed", right: "Code is often stable; data is the variable" },
        { left: "Assert specific outputs from specific inputs", right: "Assert *properties* of the data — not-null, uniqueness, range, distribution" },
        { left: "Runs in CI against fixtures", right: "Runs on every pipeline run against production data" },
        { left: "Failures mean a code bug", right: "Failures mean code bug, upstream drift, OR an unusual business event" },
        { left: "Test files committed alongside code", right: "Assertions live next to model definitions (dbt YAML, Great Expectations) and watch each run" },
      ],
    },
  },
  {
    concept_slug: "data-quality-as-tests",
    sort_order: 2,
    type: "dimensions",
    payload: {
      title: "The assertion library",
      intro: "What you actually check. Mix and match per dataset — most production datasets need 5–10 active assertions.",
      items: [
        { name: "Uniqueness", description: "Primary keys, business keys, (user_id, date) — never duplicated. DB constraints rarely available in OLAP, so you assert post-load." },
        { name: "Not-null", description: "Required fields. Catches schema drift or upstream config changes that introduce missing values." },
        { name: "Accepted values", description: "Categorical columns within a known set. Catches new enum values that downstream code doesn't handle." },
        { name: "Referential integrity", description: "Foreign keys resolve to a parent row in the dimension table. Catches orphan facts." },
        { name: "Range / domain", description: "Numerics within plausible bounds; dates in plausible windows. Revenue ≥ 0; age ≤ 120." },
        { name: "Freshness", description: "max(timestamp) within an SLA window. \"Is this table being updated?\"" },
        { name: "Volume", description: "Row count within X% of trailing average. Catches silent dropoffs." },
        { name: "Distribution / drift", description: "Mean, median, percentiles within expected drift bands. Catches value shifts that pass type checks." },
      ],
    },
  },
  {
    concept_slug: "data-quality-as-tests",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "Bad-row handling — circuit breaker, DLQ, or just fail?",
      items: [
        {
          scenario: "Financial transactions ingestion — a row arrives with `amount = NULL`.",
          consequence:
            "Quarantining is wrong for critical data: silently allowing some transactions to be partially processed corrupts financial reports.",
          de_catches_it: "Fail loudly. Halt the pipeline. Page someone. Money requires strict-mode assertions.",
        },
        {
          scenario: "Clickstream events ingestion — 200 of 50M rows have malformed user agents.",
          consequence:
            "Failing the whole pipeline for 200 bad rows wastes the other 49,999,800 rows of valid events.",
          de_catches_it: "Quarantine the bad rows to a side table (DLQ pattern); continue with the good ones. Alert on quarantine depth so someone investigates.",
        },
        {
          scenario: "Silver→gold publish: bad rows would propagate into executive dashboards.",
          consequence:
            "Executives lose trust in numbers permanently when corrections happen retroactively.",
          de_catches_it: "Circuit breaker at the boundary: if quality assertions fail, BLOCK the publish to gold. Better to serve yesterday's correct numbers than today's broken ones.",
        },
        {
          scenario: "Source's `email` field starts arriving 30% null after a frontend deploy. No assertion was watching.",
          consequence:
            "Marketing campaigns miss a third of users for the next week before someone notices.",
          de_catches_it: "Null-rate assertion vs trailing average. Add the assertion when you first land the column, not after the first incident.",
        },
      ],
    },
  },
  {
    concept_slug: "data-quality-as-tests",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "Daily revenue rows look fine: types match, no nulls, all values positive. But today's total revenue is half of yesterday's. Which kind of test catches this?",
      options: [
        { id: "a", text: "Type / schema check on the `revenue` column.", correct: false },
        { id: "b", text: "Not-null assertion on `revenue`.", correct: false },
        {
          id: "c",
          text: "Volume + distribution test: row count and SUM(revenue) within X% of trailing 7-day average. Triggers when today's value drifts significantly from the baseline.",
          correct: true,
        },
        { id: "d", text: "Uniqueness assertion on `order_id`.", correct: false },
      ],
      explanation:
        "Structural assertions (type, not-null, uniqueness) all pass because the data is well-formed — there's just less of it (or smaller values). The miss is a *distribution* property: today's value diverges from recent history. Tools like Great Expectations, dbt's `dbt_utils.expression_is_true` with rolling-average comparisons, and Monte Carlo specialize in this kind of distribution-vs-baseline assertion.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // transformation-layering
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "transformation-layering",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Declarative SQL vs imperative code",
      left_label: "SQL-based (dbt)",
      right_label: "Code-based (Python / Spark)",
      pairs: [
        { left: "Declarative — \"what,\" not \"how\"", right: "Imperative — full procedural control" },
        { left: "Warehouse-native; runs in Snowflake/BigQuery", right: "External compute (Spark cluster, Python service)" },
        { left: "Accessible to analysts (analytics engineering)", right: "Requires software-engineering skills" },
        { left: "Excellent for joins / aggregations / windows (80% case)", right: "Wins for complex procedural logic, ML features, unstructured parsing, external API calls" },
        { left: "Optimizer chooses execution plan", right: "You choose the algorithm" },
        { left: "Tests + docs + lineage built into the framework", right: "Roll your own (pytest + custom lineage)" },
      ],
    },
  },
  {
    concept_slug: "transformation-layering",
    sort_order: 2,
    type: "dimensions",
    payload: {
      title: "Staging → Intermediate → Mart",
      intro: "The dbt-canonical layering. Push volatility to the edges; keep stable business logic in the core.",
      items: [
        {
          name: "Staging",
          description: "One-to-one with sources. Only place that knows a source's quirks. Light cleanup: rename columns, cast types, dedupe. No joins, no business logic.",
          swe_parallel: "Adapter / anti-corruption layer — isolates the volatile source-specific code",
        },
        {
          name: "Intermediate",
          description: "Business logic lives here. Joins between staging models, derived columns, type-2 SCD applied. The reasoning layer.",
          swe_parallel: "Domain layer — stable across source-system changes",
        },
        {
          name: "Mart",
          description: "Consumer-facing dimensional models, aggregates, business metrics. The contract consumers depend on. Often per-team (finance_mart, marketing_mart) so blast radius is bounded.",
          swe_parallel: "Presentation / API layer — the published interface",
        },
      ],
    },
  },
  {
    concept_slug: "transformation-layering",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "Layering violations and what they cost",
      items: [
        {
          scenario: "Business logic is written in the staging layer (\"easier to put it all in one place\")",
          consequence:
            "When the source changes a column name, both the renaming AND the business logic have to change. Multiple maintainers touch the same file for unrelated reasons.",
          de_catches_it: "Strict staging-only-does-renames discipline; keep business logic downstream in intermediate.",
        },
        {
          scenario: "A mart model joins directly to a staging model (skipping intermediate)",
          consequence:
            "Source-system quirks leak into the consumer-facing model. The next source schema change ripples all the way to the mart.",
          de_catches_it: "Mart models only reference intermediate (or other marts). The intermediate layer is the buffer.",
        },
        {
          scenario: "One giant monolithic SQL file does staging, joins, and aggregation",
          consequence:
            "No part can be tested or rebuilt in isolation. Schema changes ripple through everything. The orchestrator can't parallelize.",
          de_catches_it: "Break into a DAG of small models, each with a single responsibility. dbt's `ref()` builds the dependency graph automatically.",
        },
        {
          scenario: "Heavy ML feature engineering shoved into dbt SQL because \"we're an ELT shop\"",
          consequence:
            "500 lines of nested CTEs reimplementing array operations and string parsing that Python would do in 5 lines.",
          de_catches_it: "Drop to Python/Spark for the heavy procedural step; write the result back to the warehouse; let dbt SQL handle the modeling layer downstream.",
        },
      ],
    },
  },
  {
    concept_slug: "transformation-layering",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "The Salesforce source renames `Customer_Name__c` to `Account_Name__c`. Three downstream marts use customer data. In a staging-intermediate-mart layered DAG, where do you make the change?",
      options: [
        { id: "a", text: "Update each of the three mart models to reference the new column name.", correct: false },
        {
          id: "b",
          text: "Update the single staging model for Salesforce — rename the column there. The intermediate and mart layers, which reference the staging model's alias, don't change.",
          correct: true,
        },
        { id: "c", text: "Refactor everything end-to-end since column names are part of the contract.", correct: false },
        { id: "d", text: "Add a new staging model for the new column name and leave the old one in place.", correct: false },
      ],
      explanation:
        "Staging models exist precisely to isolate this kind of change. The staging model aliases `Customer_Name__c` to whatever the downstream layers reference (e.g., `customer_name`). When the source renames the column, you update the staging model's `SELECT Account_Name__c AS customer_name` — done. The intermediate and mart layers, which only know `customer_name`, are untouched. This is the adapter pattern: volatile source-specific code at the edges; stable business logic in the core.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // dags
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "dags",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Task-centric vs asset-centric orchestration",
      left_label: "Task-centric (Airflow's default)",
      right_label: "Asset-centric (Dagster, dbt)",
      pairs: [
        { left: "You wire `task_a >> task_b` explicitly", right: "You declare \"asset B is built from A\"; framework infers the DAG" },
        { left: "The unit is a job/task", right: "The unit is a data asset (a table, a file, a model)" },
        { left: "Graph can drift from the code (hand-maintained)", right: "Graph can't drift — derived from declarations" },
        { left: "Cron-aligned: \"run B at 7 AM\"", right: "Data-aware: \"B runs when A's data for this partition is ready\"" },
        { left: "Freshness measured on the job", right: "Freshness measured on the asset" },
      ],
    },
  },
  {
    concept_slug: "dags",
    sort_order: 2,
    type: "dimensions",
    payload: {
      title: "What the DAG buys you for free",
      intro: "Encoding dependencies as a graph gives the orchestrator three things automatically — the same three you get from a build system.",
      items: [
        {
          name: "Valid execution order",
          description: "Topological sort produces a sequence where every task runs after its prerequisites. Same algorithm a package manager uses to resolve install order.",
        },
        {
          name: "Parallelism",
          description: "Independent subtrees can run concurrently — discovered automatically by inspecting the graph, no manual coordination needed.",
        },
        {
          name: "Incremental rebuild",
          description: "Change one node; the orchestrator computes the minimum set of downstream nodes that need to re-run. Same as `bazel build` rebuilding only what depends on a changed source.",
        },
        {
          name: "Cycle detection",
          description: "A cycle means a task transitively depends on itself — unrunnable. The orchestrator rejects it at load time, the way a build tool rejects circular `#include`s.",
        },
      ],
    },
  },
  {
    concept_slug: "dags",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "What you lose without an orchestrator (cron-pile anti-patterns)",
      items: [
        {
          scenario: "Cron runs job B every day at 7 AM, regardless of whether the upstream job A succeeded the night before.",
          consequence:
            "When A fails, B runs on stale data and produces a subtly wrong dashboard. The dashboard says \"success.\" Nobody knows the numbers are last week's.",
          de_catches_it: "Use an orchestrator: B becomes downstream of A in the DAG, and if A fails or is late, B is blocked (`upstream_failed`).",
        },
        {
          scenario: "Two cron jobs both depend on the same input file. They're scheduled close enough that one runs before the file is fully written.",
          consequence:
            "One job processes a truncated file; results are wrong. No error — just bad data.",
          de_catches_it: "A `FileSensor` blocks until the file is complete (or the upload signals \"done\"). Event-driven dependency, not time-aligned guessing.",
        },
        {
          scenario: "A cron-scheduled refresh runs on the hour. The upstream source publishes new data at :05.",
          consequence:
            "Every run processes the previous hour's snapshot. The dashboard is *one hour late forever*, and nobody notices.",
          de_catches_it: "Sensor on the source's \"published\" event, or DAG scheduled after the publish time with explicit alignment.",
        },
      ],
    },
  },
  {
    concept_slug: "dags",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "A team migrates from cron-scheduled scripts to Airflow. What's the most important thing they gain?",
      options: [
        { id: "a", text: "Faster execution.", correct: false },
        {
          id: "b",
          text: "Dependency-aware execution: if A fails, downstream B doesn't run on stale or missing data. Plus retries, sensors for external events, and a visual DAG.",
          correct: true,
        },
        { id: "c", text: "Less code to maintain.", correct: false },
        { id: "d", text: "Cheaper compute.", correct: false },
      ],
      explanation:
        "Cron fires jobs at scheduled times regardless of whether upstream succeeded. An orchestrator makes the dependency graph explicit: downstream tasks block on upstream success, retries are first-class, and sensors handle external events. The result is fewer silent corruption bugs from \"job ran but data was wrong.\"",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // dependency-management
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "dependency-management",
    sort_order: 1,
    type: "comparison",
    payload: {
      title: "Code dependency vs data dependency",
      left_label: "Build system",
      right_label: "Data orchestrator",
      pairs: [
        { left: "\"A.o is built before B.o\"", right: "\"A's *data for partition X* is ready before B processes partition X\"" },
        { left: "Topological sort over source-file imports", right: "Topological sort over data assets (with a time axis)" },
        { left: "Edges are static (import statements)", right: "Edges can be dynamic — depend on external signals (sensors)" },
        { left: "Failed compile → build halts, you see it now", right: "Failed task → orchestrator marks downstream as blocked across the entire DAG" },
        { left: "Reruns rebuild the whole tree from a clean state", right: "Reruns are scoped to specific partitions (logical date ranges)" },
      ],
    },
  },
  {
    concept_slug: "dependency-management",
    sort_order: 2,
    type: "dimensions",
    payload: {
      title: "Kinds of dependencies an orchestrator manages",
      intro: "Each kind has a different mechanism. Modern orchestrators model all four.",
      items: [
        {
          name: "Intra-DAG (task-to-task)",
          description: "`task_a >> task_b` — B runs after A succeeds. The simplest case; just topological sort over the explicit edges.",
        },
        {
          name: "Cross-DAG (workflow-to-workflow)",
          description: "Pipeline X waits on pipeline Y, which has its own schedule and owner. `ExternalTaskSensor` in Airflow; cross-job dependencies in Dagster.",
        },
        {
          name: "External / sensor-based",
          description: "Block until a file lands in S3, a Kafka message arrives, or an API endpoint returns ready. Event-driven dependency layered on top of schedule-driven.",
        },
        {
          name: "Time-partitioned (data-aware)",
          description: "B's run for partition X waits on A's *materialization for partition X*, not just on A's process exiting. The novel data-DAG concept that has no direct build-system equivalent.",
        },
      ],
    },
  },
  {
    concept_slug: "dependency-management",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "Dependency mistakes that silently corrupt downstream",
      items: [
        {
          scenario: "Team adds a new transform that depends on an upstream table — but doesn't declare the dependency in the DAG (uses raw cron timing instead).",
          consequence:
            "On a slow night, upstream runs late. The downstream transform fires at its scheduled minute, processes yesterday's data instead of today's, and the executive dashboard shows yesterday's numbers labeled as today's.",
          de_catches_it: "Always declare the dependency in the DAG. The orchestrator blocks downstream until upstream materializes.",
        },
        {
          scenario: "DAG has implicit dependency on a third-party vendor file landing in S3 by 6 AM. No sensor — the team just schedules the consuming job for 6:05 AM.",
          consequence:
            "Vendor is occasionally late. When the file lands at 6:15, the 6:05 job processed an empty/missing input and silently wrote zeros downstream.",
          de_catches_it: "S3 `FileSensor` blocks until the file exists. Or schedule a poke-style sensor with timeout + alert.",
        },
        {
          scenario: "Two pipelines own different parts of the same fact table. Neither pipeline knows about the other; both write on independent schedules.",
          consequence:
            "Race conditions. Readers see partial updates. Reports computed across the two halves are inconsistent.",
          de_catches_it: "Single owner per asset, or explicit cross-DAG sensors with locking semantics. Or, better, refactor: one pipeline produces the fact table.",
        },
        {
          scenario: "Team wires dependencies at task level (\"task A runs before task B\") instead of partition level. A's daily run for date X completes at 11 PM; B's daily run starts at 11:01 PM but processes date Y.",
          consequence:
            "B's date-Y run doesn't actually need A's date-X output. The dependency is over-conservative — every B run waits on the corresponding A run, even when partitions don't align.",
          de_catches_it: "Time-partitioned dependencies: B's run for date Z waits on A's run for date Z (or aligned offset). Both Airflow's data-aware scheduling and Dagster's partitioned assets handle this.",
        },
      ],
    },
  },
  {
    concept_slug: "dependency-management",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "Your pipeline depends on a daily CSV from a third-party vendor that *usually* lands in S3 by 6 AM, but sometimes is hours late. How do you handle the dependency correctly?",
      options: [
        { id: "a", text: "Schedule the downstream job at 7 AM (an hour buffer). Hope the file is there.", correct: false },
        {
          id: "b",
          text: "Use a sensor (e.g., Airflow's `S3KeySensor`) that blocks the downstream job until the file actually lands. Set a reasonable timeout that triggers an alert if the file is *very* late.",
          correct: true,
        },
        { id: "c", text: "Use cron at 6:05 AM regardless.", correct: false },
        { id: "d", text: "Have the downstream job loop until the file appears.", correct: false },
      ],
      explanation:
        "Sensors are the canonical way to express \"wait for an external event before proceeding.\" `S3KeySensor` (or equivalent) blocks until the file exists, with an explicit timeout so the dependency doesn't hang forever. Cron + buffer is fragile (file could be later than your buffer); job-internal polling is hidden from the orchestrator (it can't see why the job is slow). Express the dependency at the orchestrator level, where it's observable.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // backfilling
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "backfilling",
    sort_order: 1,
    type: "failure_catalog",
    payload: {
      title: "Backfill traps — when re-running history produces wrong history",
      items: [
        {
          scenario: "Transform uses `now()` or `CURRENT_DATE` in the row body.",
          consequence:
            "Backfilling March 2024 stamps rows with *today's* date. Joins and time-series queries on those rows look wrong forever.",
          de_catches_it: "Pass the logical date in as a parameter. Use that, not `now()`, for any time-stamped column.",
        },
        {
          scenario: "Currency-conversion transform calls a third-party exchange rate API at runtime — \"get today's USD→EUR rate.\"",
          consequence:
            "Backfilling March 2024 applies today's exchange rate to March's transactions. Historical revenue in EUR is wrong by months of FX drift.",
          de_catches_it: "Snapshot exchange rates daily into a dim table; join the transform against that table by date. Same problem, same fix as SCD Type 2.",
        },
        {
          scenario: "Transform joins to a customer dim table that's been overwriting addresses (SCD Type 1).",
          consequence:
            "Backfilling March 2024 attributes March orders to customers' *current* cities. \"Revenue by city for Q1 2024\" silently changes every time a customer moves.",
          de_catches_it: "Use SCD Type 2: each fact references the dim version that was current when the event happened. Phase 2 covered why this matters; backfilling is when you actually feel it.",
        },
        {
          scenario: "Backfill kicks off and runs all 365 days of last year concurrently. The source database melts.",
          consequence: "Production DB hits 100% CPU, primary-app latency spikes, SREs page the on-call.",
          de_catches_it: "Concurrency limits on backfills (Airflow `max_active_runs`, Dagster partition concurrency). Cap to 2–5 partitions in parallel; let the backfill take longer rather than nuking the source.",
        },
      ],
    },
  },
  {
    concept_slug: "backfilling",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "Logical date vs wall-clock time",
      left_label: "Wall-clock time",
      right_label: "Logical date (partition)",
      pairs: [
        { left: "\"This script ran at 2026-06-02 03:00 UTC.\"", right: "\"This run is processing partition 2026-06-01.\"" },
        { left: "Where `now()` and `CURRENT_DATE` come from", right: "What the transform should use for any time-stamped column" },
        { left: "Same wall-clock time can mean different partitions across reruns", right: "Same logical date = same input = same output (deterministic)" },
        { left: "Useful for: logging when something ran", right: "Useful for: identifying which time-slice of data was processed" },
        { left: "Wrong to use *inside* a transform's data", right: "The correct parameter to pass into the transform" },
      ],
    },
  },
  {
    concept_slug: "backfilling",
    sort_order: 3,
    type: "dimensions",
    payload: {
      title: "Common backfill use cases",
      intro: "Each one is a re-run over a historical range, with different motivations.",
      items: [
        {
          name: "Populating a new derived table",
          description: "You added a new mart that should have two years of history. Backfill computes it across the past 730 partitions.",
        },
        {
          name: "Bug fix recovery",
          description: "Found a logic bug that's been miscalculating revenue for 90 days. Fix the code; backfill the affected window; the fix propagates through history.",
        },
        {
          name: "Gap fill",
          description: "A pipeline failed silently for three days. Identify the missing partitions and re-run.",
        },
        {
          name: "Schema or definition change",
          description: "The team agreed on a new \"signup\" definition. Backfill the historical signups table so YoY comparisons stay meaningful.",
        },
        {
          name: "New source",
          description: "Onboarding a vendor with a year of historical export. Backfill that history into bronze before normal incremental runs take over.",
        },
      ],
    },
  },
  {
    concept_slug: "backfilling",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "You're backfilling 90 days because of a revenue-calculation bug. The transform looks correct after the fix. Two weeks later analysts notice the backfilled rows have different `created_year` values than they should. What's the likely cause?",
      options: [
        { id: "a", text: "Concurrency limits weren't set during the backfill.", correct: false },
        {
          id: "b",
          text: "The transform uses `EXTRACT(YEAR FROM CURRENT_DATE)` somewhere. The backfill stamped all 90 days with the *current* year instead of the historical year.",
          correct: true,
        },
        { id: "c", text: "Snowflake had a temporary outage.", correct: false },
        { id: "d", text: "The backfill ran too fast.", correct: false },
      ],
      explanation:
        "Classic `now()` / `CURRENT_DATE` trap. The transform was correct under normal incremental runs (where wall-clock and logical date roughly agree), but during backfill the wall-clock is *today* while the logical date is months in the past. Any time-stamped column built from `CURRENT_DATE` reflects today, not the partition being processed. Fix: pass the logical date as a parameter; use it everywhere.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // failure-modes
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "failure-modes",
    sort_order: 1,
    type: "dimensions",
    payload: {
      title: "The resilience toolkit",
      intro: "Each tool maps to a distributed-systems pattern an SWE already knows.",
      items: [
        {
          name: "Retries with exponential backoff",
          description: "For transient failures: network blip, DB momentary unavailability, rate limit. Automatic, up to a max-attempts. Precondition: idempotency.",
          swe_parallel: "HTTP client retrying on 5xx with backoff",
        },
        {
          name: "Dead-letter queue (DLQ)",
          description: "For bad *records* in an otherwise-good batch. Quarantine the row; let the pipeline make progress; alert on quarantine depth.",
          swe_parallel: "Same DLQ pattern as Kafka / SQS consumers",
        },
        {
          name: "Timeouts",
          description: "Cap how long a task can run. A hung task blocks the whole DAG; timeout + retry restores progress.",
          swe_parallel: "Request timeouts on HTTP clients",
        },
        {
          name: "Circuit breaker",
          description: "Stop publishing to downstream when quality assertions fail. Better to serve last-known-good than to publish broken data.",
          swe_parallel: "Hystrix-style circuit breaker",
        },
        {
          name: "Graceful degradation",
          description: "When fresh data isn't available, serve the last successful snapshot rather than nothing.",
          swe_parallel: "Cached-response fallback during outage",
        },
        {
          name: "Isolation (bulkheads)",
          description: "One team's failing DAG must not take down the scheduler or starve other teams' jobs. Resource pools, dedicated workers.",
          swe_parallel: "Microservice bulkhead pattern",
        },
      ],
    },
  },
  {
    concept_slug: "failure-modes",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "Transient vs permanent failures",
      left_label: "Transient (retry)",
      right_label: "Permanent (fail fast, alert)",
      pairs: [
        { left: "Network timeout, source DB connection drop", right: "Schema mismatch, logic bug, division by zero" },
        { left: "Self-resolves on retry", right: "Will fail the same way no matter how many times you retry" },
        { left: "Common — happens nightly under any meaningful load", right: "Rare but always actionable" },
        { left: "Tune retries to absorb silently (no human paged)", right: "Page the on-call; needs intervention" },
        { left: "Idempotency is the precondition that makes retry safe", right: "No safety amount of retry will fix this" },
      ],
    },
  },
  {
    concept_slug: "failure-modes",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "Alert fatigue — when the resilience kit becomes the problem",
      items: [
        {
          scenario: "Every transient task failure pages the on-call. Three pages a night, all auto-resolved on retry.",
          consequence: "On-call stops looking carefully at pages — when a real one fires, it's lost in the noise.",
          de_catches_it: "Page only on retries-exhausted *and* SLA-tracked dataset. Transient + recovered = silent.",
        },
        {
          scenario: "Same alert fires for a missing column (urgent) and a delayed-by-5-minutes job (not urgent).",
          consequence: "On-call can't distinguish. Treats both as urgent, burns out. Or treats both as routine, misses real ones.",
          de_catches_it: "Two severity levels. \"Page now\" for SLA-impacting; \"open a ticket\" for everything else.",
        },
        {
          scenario: "Green pipeline run, but downstream dashboard shows nonsense — silent data corruption.",
          consequence: "Nobody noticed for a week. By the time someone asks \"why are the numbers weird?\", a board meeting has used them.",
          de_catches_it: "Alert on data signals (freshness, volume, distribution), not just job-success. A green run is necessary but not sufficient.",
        },
        {
          scenario: "Alert says \"task failed\" with no context — no DAG ID, no execution date, no log link.",
          consequence: "On-call spends 10 minutes finding what failed before they can even start fixing it.",
          de_catches_it: "Alert templates that include DAG ID, execution date, error excerpt, and a link to the run UI. Make every page actionable.",
        },
      ],
    },
  },
  {
    concept_slug: "failure-modes",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "A batch of 50M events is being ingested. One row has `amount = 'banana'` (string in a numeric column). What's the right reaction?",
      options: [
        { id: "a", text: "Retry the batch — maybe it'll work next time.", correct: false },
        {
          id: "b",
          text: "Route that one row to a DLQ; let the other 49,999,999 rows succeed. Alert when the DLQ grows.",
          correct: true,
        },
        { id: "c", text: "Fail the whole batch; halt downstream.", correct: false },
        { id: "d", text: "Silently drop the bad row.", correct: false },
      ],
      explanation:
        "This is the classic DLQ pattern. The failure is *permanent for that row* (retrying won't fix \"banana\"), but the batch is otherwise fine. Failing the whole batch wastes 49,999,999 good rows. Silently dropping loses the evidence. Quarantining preserves the bad row, keeps the pipeline making progress, and the DLQ depth tells you when something upstream changed (one bad row = noise; thousands = investigate).",
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // sla-for-data
  // ═══════════════════════════════════════════════════════════════════
  {
    concept_slug: "sla-for-data",
    sort_order: 1,
    type: "dimensions",
    payload: {
      title: "The two dimensions of a data SLA — and the SRE vocabulary",
      intro: "API SLAs are mostly about availability; data SLAs have two axes plus the SLI/SLO/SLA stack.",
      items: [
        {
          name: "Freshness",
          description: "How recent is the data? \"Yesterday's sales available by 8 AM.\" \"Orders mart no more than 24 hours stale.\"",
          swe_parallel: "Request latency, but measured on the data not the response",
        },
        {
          name: "Completeness",
          description: "Is everything expected present and valid? Row counts in range, no missing partitions, quality checks passing.",
          swe_parallel: "No clean API analogue — the response was returned, but the body is wrong",
        },
        {
          name: "SLI (Service Level Indicator)",
          description: "The measured signal. \"Actual data lag in minutes.\" \"Percent of rows passing data-quality checks.\"",
        },
        {
          name: "SLO (Service Level Objective)",
          description: "Your internal target. \"99% of runs finish within 30 minutes of source publication.\" Used to manage on-call effort.",
        },
        {
          name: "SLA (Service Level Agreement)",
          description: "The promise made to consumers. Usually looser than the SLO so you have headroom. The contractual external face.",
        },
      ],
    },
  },
  {
    concept_slug: "sla-for-data",
    sort_order: 2,
    type: "comparison",
    payload: {
      title: "API SLA vs data SLA",
      left_label: "API SLA",
      right_label: "Data SLA",
      pairs: [
        { left: "Mostly one-dimensional: availability + latency", right: "Two-dimensional: freshness + completeness" },
        { left: "\"99.9% of requests return within 500ms\"", right: "\"Orders mart freshness < 24h, completeness > 99% of expected rows\"" },
        { left: "A 200 response with the right body is success", right: "A green pipeline run with stale data is *failure*" },
        { left: "Failure is loud (5xx response)", right: "Failure is often silent (table exists, queries return, data is wrong)" },
        { left: "Measured at the request boundary", right: "Measured on the data asset itself, decoupled from any single job's success" },
      ],
    },
  },
  {
    concept_slug: "sla-for-data",
    sort_order: 3,
    type: "failure_catalog",
    payload: {
      title: "SLA failures with no clean API analogue",
      items: [
        {
          scenario: "Job ran successfully and produced output, but the upstream sensor that should have signaled \"new data\" never fired. Output is identical to yesterday's.",
          consequence:
            "Job-level SLA shows green. Data is stale. Dashboards built on it lie. No alert.",
          de_catches_it: "Asset-level freshness policy: continuously check \"is this asset younger than X?\" — independent of any single job's success.",
        },
        {
          scenario: "Pipeline finishes at 7:55 AM (8 AM SLA), but quality assertions fail and the circuit-breaker blocks publishing to gold. Consumers see yesterday's data.",
          consequence:
            "Strictly speaking the gold table is *stale* (freshness SLA breached), but *correct* (completeness SLA preserved). The right trade-off depends on the consumer.",
          de_catches_it: "Separate freshness SLA from completeness SLA. Sometimes \"correct but late\" is the right answer; alert on both, but they're distinct events.",
        },
        {
          scenario: "SLA is defined on the *job* (\"daily revenue job must finish by 8 AM\"). Job finishes at 7:55 AM but writes empty output.",
          consequence: "Job-level SLA: met. Data-level reality: catastrophic.",
          de_catches_it: "Promise about the *outcome* (the data), not the *work* (the job). Asset-level freshness + completeness; the job is the implementation detail.",
        },
        {
          scenario: "Team promises \"100% freshness SLA, zero downtime, zero late data.\"",
          consequence:
            "Unmeetable. First failure becomes a crisis. Team burns out chasing perfection.",
          de_catches_it: "Error-budget mindset: define what *acceptable* freshness and completeness look like (99.5%, not 100%); spend reliability effort against the budget. Don't promise perfection.",
        },
      ],
    },
  },
  {
    concept_slug: "sla-for-data",
    sort_order: 4,
    type: "inline_quiz",
    payload: {
      prompt:
        "Two ways to express \"the orders mart must be no more than 24 hours stale.\" Which is more robust?",
      options: [
        { id: "a", text: "Job-level SLA: \"the orders refresh job must succeed every 24 hours.\"", correct: false },
        {
          id: "b",
          text: "Asset-level freshness policy: \"the orders mart's last-update timestamp must be within 24 hours, continuously checked,\" independent of any single job's success.",
          correct: true,
        },
        { id: "c", text: "Both are equally good.", correct: false },
        { id: "d", text: "Neither — freshness can't be promised.", correct: false },
      ],
      explanation:
        "Job-level SLAs miss whole classes of failure: the job succeeded but produced no new data; the job failed but a recent earlier run is still fresh enough; a sensor blocked the job for a legitimate reason. Asset-level freshness checks the *outcome* — is the data current? — decoupled from how it got that way. This is the same shift as SRE moving from monitoring deploys to monitoring user-facing SLOs.",
    },
  },
];
