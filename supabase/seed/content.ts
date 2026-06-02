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
      "Normalization is DRY applied to data: every fact stored exactly once, so an update touches one place. That's ideal for OLTP — a write-heavy, mutable world. Analytics inverts the economics: a query like \"revenue by city\" joining orders → customers → cities becomes an expensive distributed shuffle at a billion rows. So you denormalize — bake the city directly onto each order row. The redundancy that would be dangerous in a mutable system is harmless here because analytical data is largely append-only — you're recording history, not maintaining current state.",
    swe_analogy:
      "DRY is a write-time virtue. In code you extract a shared module so a change happens in one place. In analytics the data is immutable history — you often *want* the city frozen as it was at order time, not silently changed when the customer moves. Denormalization aligns with that: redundancy is safe because nothing's being updated.",
    sort_order: 1,
  },
  {
    slug: "dimensional-modeling",
    phase_slug: "data-modeling-fundamentals",
    title: "Dimensional modeling",
    description:
      "Kimball's approach: separate the world into *facts* (the verbs — measurable events like a sale, a click, a shipment) and *dimensions* (the nouns and adjectives that describe them — which product, which customer, when). Fact tables are tall and thin: billions of rows, few columns, append-only, holding numeric measures plus foreign keys to dimensions. Dimension tables are short and wide: lots of descriptive attributes, fewer rows. One fact table surrounded by its dimensions is a *star schema*. The model is shaped like the questions: \"revenue, sliced by region and month\" is just *aggregate this measure, grouped by these dimensions*.",
    swe_analogy:
      "Facts are application logs — high-volume, timestamped events. Dimensions are the metadata about your domain that gives those logs meaning. A *conformed dimension* — \"customer\" defined once and reused across many fact tables — is the interface-defined-once-and-reused principle applied to shared reference data.",
    sort_order: 2,
  },
  {
    slug: "grain-is-everything",
    phase_slug: "data-modeling-fundamentals",
    title: "Grain is everything",
    description:
      "The single most important decision in dimensional modeling is *grain* — defining exactly what one row in a fact table represents, before anything else. One order? One line item per order? One daily snapshot per account? Get it wrong and double-counting creeps in everywhere: `SUM(revenue)` is off by a factor of N, every dashboard built on it lies, and you find out at quarter-end during reconciliation. The discipline: write the grain as a single sentence at the top of every fact-table definition, and test that the natural key for that grain is actually unique.",
    swe_analogy:
      "The unit of analysis is the type signature of the table. \"This function takes a customer and returns a list of recommendations\" is a clearer contract than \"this function takes some data and returns some other data\" — and the same is true of a fact table. Get the grain explicit and downstream queries write themselves; leave it ambiguous and every join is a guess.",
    sort_order: 3,
  },
  {
    slug: "slowly-changing-dimensions",
    phase_slug: "data-modeling-fundamentals",
    title: "Slowly changing dimensions (SCD)",
    description:
      "Dimension attributes drift over time — a customer relocates, a product gets recategorized, a rep changes territory. *How* you handle that change is the SCD type. **Type 1** overwrites the old value: history is lost, fine for typos. **Type 2** expires the old row and inserts a new version with `valid_from` / `valid_to` timestamps, a new surrogate key, and an `is_current` flag — old versions stay queryable. Each fact row references the surrogate key of the dimension version that was current when the event happened, so \"revenue by the customer's city at time of sale\" stays historically accurate even after they move. (Type 3 keeps only a single \"previous value\" column; Type 6 is a hybrid; Types 1 and 2 are nearly all of practice.)",
    swe_analogy:
      "Git, with the mapping made exact: Type 1 is a force-push (history overwritten, no audit trail). Type 2 is committing — old row stays expired, new version inserted. Surrogate key = commit hash. `valid_from` / `valid_to` = commit timestamps. `is_current` = HEAD. Type 2 is how analytical databases achieve point-in-time correctness.",
    sort_order: 4,
  },
  {
    slug: "oltp-vs-olap",
    phase_slug: "data-modeling-fundamentals",
    title: "OLTP vs. OLAP",
    description:
      "OLTP databases (Postgres, MySQL) are row-oriented — a record's fields are stored contiguously on disk. Optimal for transactional apps: many small concurrent ACID transactions, each touching a few whole rows by primary key. OLAP warehouses (Snowflake, BigQuery, ClickHouse, DuckDB) are column-oriented — each column stored contiguously, often as its own file (Parquet, ORC). Analytical queries scan billions of rows but only touch a handful of columns; columnar reads *only those columns* instead of dragging fifty fields off disk for each row. A homogeneous column also compresses dramatically (run-length, dictionary) and is perfect for vectorized/SIMD execution. The trade-off is the mirror image: columnar storage is terrible at single-row writes, which is why warehouses are append-mostly and batch-loaded.",
    swe_analogy:
      "Array-of-structs vs struct-of-arrays. OLTP is AoS — optimal for *get-this-one-customer-record*. OLAP is SoA — optimal for *sum-this-column-across-a-billion-records*. Any SWE who's restructured a hot loop from AoS to SoA for cache locality and SIMD already understands why columnar wins for bulk math.",
    sort_order: 5,
  },
  {
    slug: "medallion-architecture",
    phase_slug: "data-modeling-fundamentals",
    title: "Medallion architecture (bronze / silver / gold)",
    description:
      "A layering philosophy — separation of concerns applied to the whole pipeline. **Bronze** is raw data landed exactly as it arrived: immutable, append-only, your replayable source of truth. **Silver** is cleaned, typed, deduplicated, conformed — validated and queryable. **Gold** is the business-level product: dimensional models and aggregates that consumers actually use. Each layer has one responsibility and clear contracts between stages. Because bronze is kept immutable, you can rebuild silver and gold from scratch whenever cleaning or business logic changes — the whole pipeline is *reprocessable*.",
    swe_analogy:
      "The layered architecture an SWE already knows. Bronze is the raw input/adapter layer (whatever the source threw at you, captured untouched). Silver is the domain/business-logic layer (cleansed canonical models). Gold is the presentation layer (the APIs analysts and dashboards consume). Same payoff: isolated blast radius, explicit contracts, full reprocessability.",
    sort_order: 6,
  },
  {
    slug: "data-vault",
    phase_slug: "data-modeling-fundamentals",
    title: "Data Vault",
    description:
      "A modeling methodology you apply *within* the integration layer (roughly the silver tier of an enterprise warehouse). Decomposes everything into three primitives: **Hubs** — stable business keys, the durable identity of a concept (like a customer number). **Links** — the relationships between hubs (customer bought product). **Satellites** — descriptive attributes plus their full timestamped history. Insert-only, highly normalized, optimized for auditability, parallel loading, and resilience to source change: you can bolt on a new source or attribute without restructuring what exists. Data Vault optimizes for *integration, history, adaptability*; dimensional modeling optimizes for *consumption and query ergonomics*. They aren't rivals — Vault often sits underneath as the integration layer, with star schemas built on top for users.",
    swe_analogy:
      "Hubs are aggregate roots — stable entity identities. Links are association tables. Satellites are versioned, append-only attribute bags. The whole thing has an event-sourcing character: every change to a descriptive attribute is a new row in a satellite, never an update. The cost is more upfront complexity; the payoff is that source-system changes don't blow up the model.",
    sort_order: 7,
  },

  // Phase 3
  {
    slug: "etl-vs-elt",
    phase_slug: "data-movement-and-transformation",
    title: "ETL vs. ELT",
    description:
      "Both describe the same three verbs in different order. **ETL** (Extract → Transform → Load) transforms in a dedicated processing tier *before* the data lands in the destination — historically a separate ETL server or Spark cluster. **ELT** (Extract → Load → Transform) lands raw data in the warehouse first, then transforms it *in place* using the warehouse's own compute, typically SQL via dbt. The industry shifted hard from ETL to ELT for one structural reason: cloud warehouses (Snowflake, BigQuery) decoupled storage from compute and made both cheap and elastic. Landing all the raw data first became affordable, and warehouse compute became powerful enough to transform in place. The big payoff of ELT: you keep the raw layer as your source of truth, so when a transform turns out to be buggy you re-derive from raw without re-extracting from a source that may be rate-limited, mutable, or gone. ETL still wins when you must mask or drop PII before it lands, or when a transformation is too heavy or procedural to express well in SQL.",
    swe_analogy:
      "Data gravity. Rather than hauling data out to where your transformation code lives, you move the code to where the data already sits and run it on the elastic engine that's right there. Same instinct as a stored procedure for warehouse-native work vs an external service for procedural complexity.",
    sort_order: 1,
  },
  {
    slug: "idempotency",
    phase_slug: "data-movement-and-transformation",
    title: "Idempotency — the patterns",
    description:
      "Pipelines get re-run constantly — 3 AM failures, code fixes, backfills, late-arriving data, manual reruns. A non-idempotent pipeline doesn't just fail, it accumulates corruption: every rerun adds another copy of yesterday's revenue. The concrete patterns: **upsert / MERGE on a stable business key** so a second run updates rather than duplicates. **Partition overwrite** — a daily job writes to the `date=2026-06-01` partition and a rerun replaces that partition wholesale (the cleanest idempotency primitive in batch). Alongside those mechanics, your transforms must be **deterministic**: no `now()` baked into a row's content, no dependence on processing order, no per-run random IDs. Same input → same output. (Phase 1's `idempotency-as-mindset` frames the *why*; this is the *how*.)",
    swe_analogy:
      "PUT, not POST. A PUT produces the same end state regardless of how many times you call it; a naive POST that appends creates a duplicate each time. \"Exactly-once\" delivery is mostly a myth — what you actually build is **at-least-once delivery + idempotent writes = effectively once**. Same mindset as Terraform or Kubernetes: stop writing imperative \"append this event\" scripts; declare a desired end state and let the reconciling write converge to it.",
    sort_order: 2,
  },
  {
    slug: "incremental-vs-full-loads",
    phase_slug: "data-movement-and-transformation",
    title: "Incremental vs. full loads",
    description:
      "A **full load** reprocesses everything every run — truncate and reload, or rebuild the whole table. Simple, self-healing (each run is authoritative, so drift is impossible), trivially idempotent. Its only flaw is that cost and runtime scale with total data size; it stops being viable at billions of rows or high run frequency. An **incremental load** processes only what changed since the last run — a delta — dramatically cheaper at scale and enabling frequent runs, at the price of real complexity. The danger is *silent drift*: if your watermark (typically `updated_at` or a monotonically increasing id) catches inserts but a source row is *updated* late — or *hard-deleted* — your incremental table quietly diverges from reality and nobody gets an error. The defenses: periodic full-reload reconciliation to heal drift, or Change Data Capture (CDC). Common pattern in practice: full loads for small dimensions, incremental for the giant fact and event tables.",
    swe_analogy:
      "`git pull` vs `git clone`. Incremental is git pull fetching only new commits since a known ref; full load is a fresh clone. The analogy also exposes the danger: a diff is only correct if you have a correct notion of \"since when\" — and a watermark on `updated_at` doesn't catch deletes or late updates whose timestamp slipped behind your last run.",
    sort_order: 3,
  },
  {
    slug: "change-data-capture",
    phase_slug: "data-movement-and-transformation",
    title: "Change Data Capture (CDC)",
    description:
      "The gold-standard incremental pattern. Instead of polling a source table with `WHERE updated_at > :watermark` and hoping you catch every change, CDC reads the source database's *write-ahead log* (Postgres WAL, MySQL binlog, MongoDB oplog) and streams every insert, update, and delete as an event. Why this matters: naive watermarking misses *deletes* entirely (a deleted row has no `updated_at` greater than your watermark) and mishandles late updates whose timestamps fall behind. CDC sees every change as the database commits it — the downstream warehouse replays the same insert/update/delete sequence and stays in lockstep. Tools: Debezium (open-source, Kafka-based), Fivetran or Airbyte (managed), AWS DMS, Snowflake's native streams. The cost: CDC requires source-DB cooperation (replication slot, binlog access) — it's an architectural commitment, not just a query change.",
    swe_analogy:
      "Event sourcing applied to a database that wasn't designed for it. Instead of polling for state, you subscribe to the stream of state-change events the database is already producing internally for its own replication. The warehouse becomes a read-replica that can rewrite history.",
    sort_order: 4,
  },
  {
    slug: "data-quality-as-tests",
    phase_slug: "data-movement-and-transformation",
    title: "Data quality as tests — the data is the variable, not the code",
    description:
      "Conceptual inversion from software testing: in SWE you test code against fixed inputs — the code is the variable, test data is held constant. In DE the transform code is often stable while the data itself changes every single run — *the data is the variable, and it's the thing most likely to break you*. So you test the data flowing through, not only the logic. Two layers: ordinary unit tests on transform logic (given these sample rows, does the SQL produce the expected output?), and **assertions on the actual data each run** — not-null, uniqueness, accepted values, referential integrity, row counts within expected bounds, freshness, distribution/anomaly checks. dbt tests, Great Expectations, and Soda exist for exactly this. Two design choices that matter: **where to test** — at layer boundaries (bronze→silver and silver→gold) so corruption is caught early; and **what to do with bad rows** — fail the whole pipeline for critical data, or quarantine bad rows to a side table (the dead-letter-queue pattern from messaging). Quality tests also act as a *circuit breaker*: blocking bad data from reaching consumers, because wrong is worse than late.",
    swe_analogy:
      "Property-based testing (QuickCheck, fast-check) merged with production observability. You assert on the *shape* of the data — not specific values — then watch the assertions every run. The DLQ pattern is the same one you'd use for a Kafka consumer: park the bad messages, ack the rest, alert on the queue depth.",
    sort_order: 5,
  },
  {
    slug: "transformation-layering",
    phase_slug: "data-movement-and-transformation",
    title: "Transformation logic — declarative vs imperative, layered DAGs",
    description:
      "Two related decisions. First, **SQL-based vs code-based transforms.** SQL-based (dbt as the archetype) expresses each transform as a SELECT, wires the models into a dependency DAG, and version-controls, tests, and documents them. Declarative, warehouse-native for ELT, accessible to analysts, excellent for the set-based relational work (joins, aggregations, window functions) that is the 80% case. Code-based (Python, Spark) is imperative and fully expressive: complex procedural logic, ML feature engineering, unstructured data, custom parsing, external API calls. Prefer declarative when the work fits; drop to imperative when you need control declarative can't express. Real stacks mix both freely. Second, **separating raw from curated**: organize the DAG as **staging → intermediate → mart**. Staging models sit one-to-one with sources and do only light cleanup (rename, cast, dedupe) — the *only* place that knows a given source's quirks. Intermediate models hold business logic. Mart models are the consumer-facing products. When a source changes schema, the ripple stops at one staging model.",
    swe_analogy:
      "**SQL vs code**: same judgment as SQL-vs-hand-rolled or config-vs-code. Prefer declarative when the work fits; drop to imperative when you need control. **Staging → intermediate → mart**: the **adapter pattern + dependency inversion** applied to data. Push volatile, source-specific code out to the edges; keep stable business logic in the core. The transformation DAG of small testable nodes (rather than one monolithic script) is also what lets the orchestrator parallelize work and rebuild any subtree on demand.",
    sort_order: 6,
  },

  // Phase 4
  {
    slug: "dags",
    phase_slug: "pipeline-orchestration-and-reliability",
    title: "DAGs — the control plane for data",
    description:
      "A DAG (Directed Acyclic Graph) is just tasks plus directed edges with no cycles. From that single structure you get three things for free: a valid execution order (topological sort), the independent branches you can run in parallel, and the minimal set of downstream nodes to rebuild when something upstream changes — the same incremental-build logic as Make or Bazel. The DAG encodes \"what must happen before what,\" nothing else. Two flavors of how the graph comes to exist: **task-centric** (Airflow — you wire dependencies explicitly) and **asset-centric** (Dagster — you declare data assets and their inputs, framework infers the DAG; dbt does the same via `ref()`). Inferred graphs can't drift out of sync with the code the way hand-maintained ones can. The orchestrator running over this DAG is a **control plane** — it doesn't move or transform data (pipelines do that, the data plane); it decides what runs, in what order, when, what happens on failure, and whether the promises held.",
    swe_analogy:
      "A build dependency tree with a time axis. Bazel/Make + cron + incident-response, fused into one system. The asset-centric model is the same idea as a build system that infers dependencies from `#include` or `import` statements rather than making you draw them by hand.",
    sort_order: 1,
  },
  {
    slug: "dependency-management",
    phase_slug: "pipeline-orchestration-and-reliability",
    title: "Dependency management — topological ordering with a time axis",
    description:
      "Topological sort is the core algorithm: linearize the graph so every task runs after its dependencies; run independent subtrees in parallel. Identical to what a package manager does for install order or what a module loader does for imports. Two things make data dependency harder than a build. First, the dependency is **data-aware and time-partitioned**: \"A's *data for 2026-06-01* is ready before B processes 2026-06-01\" — not \"A's process exited before B's started.\" Modern orchestrators model this directly. Second, dependencies reach **outside the graph**: B might wait on a vendor file landing at 6 AM or on a dataset owned by another team — handled with **sensors** that block until the external thing exists (event-driven dependency layered on top of schedule-driven). The single most important behavior, and the reason orchestrators exist at all, is **failure propagation**: if A fails, the orchestrator marks everything downstream of A as blocked rather than letting it run on missing or stale data. That's the operational form of \"wrong is worse than late.\"",
    swe_analogy:
      "Same topological sort a package manager uses. The novel parts: the time axis (dependencies are per-partition, not just per-task), and sensors as a first-class scheduling primitive — the equivalent of waiting for an external service health check before starting your own work, elevated to part of the dependency graph.",
    sort_order: 2,
  },
  {
    slug: "backfilling",
    phase_slug: "pipeline-orchestration-and-reliability",
    title: "Backfilling",
    description:
      "Backfilling is running a pipeline over *past* time periods: to populate a new table with history, to recover from a bug that corrupted prior data, or to fill a gap left by a missed run. A first-class, frequent operation in DE — almost nonexistent in request/response software — because pipelines are partitioned by time and the same logic applies to any period. What makes backfilling **safe** is the entire payoff of Phase 3's idempotency work: re-running 2026-03-01 must overwrite that partition cleanly rather than double-count. Orchestrators parametrize every run by a **logical date** (the partition being processed, distinct from the wall-clock time the job happens to run), so the same DAG executes for any date by passing the date in. **The subtle trap:** correct backfilling requires the transform be a *pure function* of its time-partitioned input. If a transform uses current state — today's exchange rate, the customer's *present* city, `now()` stamped into a row — backfilling March applies June's context to March's data and produces wrong history. This is the operational reason point-in-time correctness and Type-2 SCDs from Phase 2 matter.",
    swe_analogy:
      "Replaying an event log against corrected code. Or: re-running a build for an old commit hash. The transform must be a pure function of its inputs — using `now()` inside a transform is the data equivalent of `Date.now()` in a unit test: a bug waiting to fire on the next backfill.",
    sort_order: 3,
  },
  {
    slug: "failure-modes",
    phase_slug: "pipeline-orchestration-and-reliability",
    title: "Failure modes — the distributed-systems resilience toolkit",
    description:
      "Pipelines run unattended every night across hundreds of jobs. Failure isn't exceptional — it's constant. The toolkit maps one-to-one onto distributed-systems patterns. **Retries** handle transient failures (source DB blip, network timeout, momentary contention) — automatic with exponential backoff up to a max. Non-negotiable precondition: idempotency. A retry after a partial write is only safe if re-running converges to the same correct state. Distinguish transient (retry) from permanent (a logic bug or genuinely bad data — fail fast and surface). **Dead-letter queues** handle bad *records* rather than failed *jobs*: an unparseable row routes to a quarantine table; the pipeline keeps making progress with the good rows. Same DLQ pattern as message queues. **Alerting** has a data-specific twist: two distinct failure classes — jobs that error/time-out, and *silent* ones (data arrived but late, incomplete, or wrong; a green run will never reveal this on its own). Both need alerts, but the second requires freshness and quality checks layered on top of mere job success. The hard operational problem is **alert fatigue**: tune retries to absorb transient noise so a human is only paged for something actionable; separate \"page on-call now\" from \"open a ticket.\" The rest of the kit — timeouts, circuit breakers, graceful degradation, isolation — is the same one you'd assemble for microservices.",
    swe_analogy:
      "The same resilience toolkit a senior backend engineer reaches for: retries with exponential backoff, DLQ from messaging, circuit breakers, bulkheads (isolation), graceful degradation (serve last-known-good), timeouts. The new wrinkle: data failures can be *silent* — a green pipeline that shipped bad numbers needs different alerting than a service returning 500.",
    sort_order: 4,
  },
  {
    slug: "sla-for-data",
    phase_slug: "pipeline-orchestration-and-reliability",
    title: "SLAs for data — freshness and completeness, not just uptime",
    description:
      "An API SLA is mostly one-dimensional: availability and latency. A data SLA has **two** dimensions: **freshness** (the data is no older than X — \"yesterday's sales available by 8 AM\") and **completeness** (everything expected is present and valid — no missing partitions, row counts in range, quality checks passing). The failure mode with no clean API analogue: a dataset can be perfectly \"up\" (the table exists, queries return instantly) and still violate its SLA by being stale or partial. Availability doesn't imply correctness. SRE vocabulary carries straight over: the **SLI** is the measured signal (actual lag, percent of rows passing checks), the **SLO** is your internal target, the **SLA** is the promise to consumers. Enforcement is increasingly *proactive*: orchestrators alert when a run is *trending* late before it has failed; asset-centric tools let you declare a **freshness policy** on the data itself (\"the orders mart must be under 24 hours old\") and continuously check it — decoupling the guarantee from any single job's success. You're promising an outcome about the **data**, not about a **job**. The honest version is the **error-budget mindset**: don't promise perfection; define acceptable freshness and completeness, measure it, spend reliability effort against the budget.",
    swe_analogy:
      "SRE's SLI/SLO/SLA model applied to information. The key shift: availability ≠ correctness. A green pipeline serving stale data is the data equivalent of a service that returns 200 OK with the wrong body. Asset-level freshness policies are the same idea as SLOs on user-facing endpoints rather than on internal service uptime.",
    sort_order: 5,
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
