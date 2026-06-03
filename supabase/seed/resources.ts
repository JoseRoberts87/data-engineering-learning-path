export type ResourceType = "article" | "docs" | "book" | "video" | "course";

export type ResourceSeed = {
  concept_slug: string;
  title: string;
  url: string;
  resource_type: ResourceType;
};

export const resources: ResourceSeed[] = [
  // ── Phase 1 ──────────────────────────────────────────
  // data-is-the-product
  {
    concept_slug: "data-is-the-product",
    title: "How to Move Beyond a Monolithic Data Lake to a Distributed Data Mesh (Zhamak Dehghani)",
    url: "https://martinfowler.com/articles/data-monolith-to-mesh.html",
    resource_type: "article",
  },
  {
    concept_slug: "data-is-the-product",
    title: "Data Mesh Principles and Logical Architecture (Zhamak Dehghani)",
    url: "https://martinfowler.com/articles/data-mesh-principles.html",
    resource_type: "article",
  },

  // batch-vs-real-time
  {
    concept_slug: "batch-vs-real-time",
    title: "Streaming Systems — Akidau, Chernyak, Lax (O'Reilly)",
    url: "https://www.oreilly.com/library/view/streaming-systems/9781491983867/",
    resource_type: "book",
  },
  {
    concept_slug: "batch-vs-real-time",
    title: "Apache Flink — Time and Watermarks (concepts)",
    url: "https://nightlies.apache.org/flink/flink-docs-master/docs/concepts/time/",
    resource_type: "docs",
  },

  // understanding-data-consumers
  {
    concept_slug: "understanding-data-consumers",
    title: "Feast — open-source feature store",
    url: "https://feast.dev/",
    resource_type: "docs",
  },
  {
    concept_slug: "understanding-data-consumers",
    title: "dbt MetricFlow — the semantic / metrics layer",
    url: "https://docs.getdbt.com/docs/build/about-metricflow",
    resource_type: "docs",
  },

  // schemas-as-contracts
  {
    concept_slug: "schemas-as-contracts",
    title: "Confluent Schema Registry",
    url: "https://docs.confluent.io/platform/current/schema-registry/index.html",
    resource_type: "docs",
  },
  {
    concept_slug: "schemas-as-contracts",
    title: "Protocol Buffers — Proto3 Language Guide",
    url: "https://protobuf.dev/programming-guides/proto3/",
    resource_type: "docs",
  },

  // failures-are-backlogs
  {
    concept_slug: "failures-are-backlogs",
    title: "Apache Airflow — Core Concepts",
    url: "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/index.html",
    resource_type: "docs",
  },
  {
    concept_slug: "failures-are-backlogs",
    title: "dbt — Incremental models",
    url: "https://docs.getdbt.com/docs/build/incremental-models",
    resource_type: "docs",
  },

  // idempotency-as-mindset
  {
    concept_slug: "idempotency-as-mindset",
    title: "dbt — Incremental strategies (merge, delete+insert, insert_overwrite)",
    url: "https://docs.getdbt.com/docs/build/incremental-strategy",
    resource_type: "docs",
  },

  // statistical-testing
  {
    concept_slug: "statistical-testing",
    title: "Great Expectations — documentation",
    url: "https://docs.greatexpectations.io/",
    resource_type: "docs",
  },
  {
    concept_slug: "statistical-testing",
    title: "dbt — Data tests",
    url: "https://docs.getdbt.com/docs/build/data-tests",
    resource_type: "docs",
  },

  // time-as-engineering-problem
  {
    concept_slug: "time-as-engineering-problem",
    title: "Apache Flink — Time, Watermarks, and Lateness",
    url: "https://nightlies.apache.org/flink/flink-docs-master/docs/concepts/time/",
    resource_type: "docs",
  },
  {
    concept_slug: "time-as-engineering-problem",
    title: "Designing Data-Intensive Applications — Martin Kleppmann",
    url: "https://dataintensive.net/",
    resource_type: "book",
  },

  // scale-and-cost-as-design-axes
  {
    concept_slug: "scale-and-cost-as-design-axes",
    title: "BigQuery — Best practices for performance & cost",
    url: "https://cloud.google.com/bigquery/docs/best-practices-performance-patterns",
    resource_type: "docs",
  },
  {
    concept_slug: "scale-and-cost-as-design-axes",
    title: "Designing Data-Intensive Applications — Martin Kleppmann",
    url: "https://dataintensive.net/",
    resource_type: "book",
  },

  // ── Phase 2 ──────────────────────────────────────────
  // normalization-vs-denormalization
  {
    concept_slug: "normalization-vs-denormalization",
    title: "Database normalization (Wikipedia overview, 1NF–BCNF)",
    url: "https://en.wikipedia.org/wiki/Database_normalization",
    resource_type: "article",
  },
  {
    concept_slug: "normalization-vs-denormalization",
    title: "dbt — How to structure marts (denormalization patterns)",
    url: "https://docs.getdbt.com/best-practices/how-we-structure/4-marts",
    resource_type: "docs",
  },

  // dimensional-modeling
  {
    concept_slug: "dimensional-modeling",
    title: "Kimball Group — Dimensional modeling techniques",
    url: "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/",
    resource_type: "article",
  },
  {
    concept_slug: "dimensional-modeling",
    title: "dbt — Modeling and marts structure",
    url: "https://docs.getdbt.com/best-practices/how-we-structure/4-marts",
    resource_type: "docs",
  },

  // grain-is-everything
  {
    concept_slug: "grain-is-everything",
    title: "Kimball — Declare the grain (one of the four-step design process)",
    url: "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/four-step-dimensional-design-process/",
    resource_type: "article",
  },

  // slowly-changing-dimensions
  {
    concept_slug: "slowly-changing-dimensions",
    title: "Kimball — Slowly Changing Dimension (Type 2)",
    url: "https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/",
    resource_type: "article",
  },
  {
    concept_slug: "slowly-changing-dimensions",
    title: "dbt — Snapshots (SCD Type 2 implementation)",
    url: "https://docs.getdbt.com/docs/build/snapshots",
    resource_type: "docs",
  },

  // oltp-vs-olap
  {
    concept_slug: "oltp-vs-olap",
    title: "DuckDB — Why DuckDB? (clear primer on columnar OLAP)",
    url: "https://duckdb.org/why_duckdb",
    resource_type: "docs",
  },
  {
    concept_slug: "oltp-vs-olap",
    title: "Designing Data-Intensive Applications — Ch. 3 (Storage and Retrieval)",
    url: "https://dataintensive.net/",
    resource_type: "book",
  },

  // medallion-architecture
  {
    concept_slug: "medallion-architecture",
    title: "Databricks — Medallion architecture (glossary)",
    url: "https://www.databricks.com/glossary/medallion-architecture",
    resource_type: "article",
  },

  // data-vault
  {
    concept_slug: "data-vault",
    title: "Data Vault 2.0 — overview (Dan Linstedt's reference site)",
    url: "https://danlinstedt.com/solutions-2/data-vault-basics/",
    resource_type: "article",
  },

  // ── Phase 3 ──────────────────────────────────────────
  // etl-vs-elt
  {
    concept_slug: "etl-vs-elt",
    title: "Fivetran — ETL vs ELT explained",
    url: "https://www.fivetran.com/learn/etl-vs-elt",
    resource_type: "article",
  },
  {
    concept_slug: "etl-vs-elt",
    title: "dbt — \"What, exactly, is dbt?\" (the modern ELT thesis)",
    url: "https://www.getdbt.com/blog/what-exactly-is-dbt",
    resource_type: "article",
  },

  // idempotency
  {
    concept_slug: "idempotency",
    title: "dbt — Incremental strategies (merge, delete+insert, insert_overwrite)",
    url: "https://docs.getdbt.com/docs/build/incremental-strategy",
    resource_type: "docs",
  },
  {
    concept_slug: "idempotency",
    title: "Snowflake — MERGE statement reference",
    url: "https://docs.snowflake.com/en/sql-reference/sql/merge",
    resource_type: "docs",
  },

  // incremental-vs-full-loads
  {
    concept_slug: "incremental-vs-full-loads",
    title: "dbt — Incremental models",
    url: "https://docs.getdbt.com/docs/build/incremental-models",
    resource_type: "docs",
  },

  // change-data-capture
  {
    concept_slug: "change-data-capture",
    title: "Confluent — What is Change Data Capture?",
    url: "https://www.confluent.io/learn/change-data-capture/",
    resource_type: "article",
  },
  {
    concept_slug: "change-data-capture",
    title: "Debezium — open-source CDC platform documentation",
    url: "https://debezium.io/documentation/reference/stable/",
    resource_type: "docs",
  },

  // data-quality-as-tests
  {
    concept_slug: "data-quality-as-tests",
    title: "dbt — Data tests",
    url: "https://docs.getdbt.com/docs/build/data-tests",
    resource_type: "docs",
  },
  {
    concept_slug: "data-quality-as-tests",
    title: "Great Expectations — documentation",
    url: "https://docs.greatexpectations.io/",
    resource_type: "docs",
  },

  // transformation-layering
  {
    concept_slug: "transformation-layering",
    title: "dbt — How we structure our dbt projects (staging → intermediate → marts)",
    url: "https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview",
    resource_type: "docs",
  },
  {
    concept_slug: "transformation-layering",
    title: "dbt — Staging models (the source-adapter layer)",
    url: "https://docs.getdbt.com/best-practices/how-we-structure/2-staging",
    resource_type: "docs",
  },

  // ── Phase 4 ──────────────────────────────────────────
  // dags
  {
    concept_slug: "dags",
    title: "Apache Airflow — Core Concepts (DAGs, tasks, dependencies)",
    url: "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/index.html",
    resource_type: "docs",
  },
  {
    concept_slug: "dags",
    title: "Dagster — Software-Defined Assets (asset-centric orchestration)",
    url: "https://dagster.io/blog/software-defined-assets",
    resource_type: "article",
  },

  // dependency-management
  {
    concept_slug: "dependency-management",
    title: "Apache Airflow — Sensors (waiting on external events)",
    url: "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/sensors.html",
    resource_type: "docs",
  },
  {
    concept_slug: "dependency-management",
    title: "Prefect — Concepts overview",
    url: "https://docs.prefect.io/",
    resource_type: "docs",
  },

  // backfilling
  {
    concept_slug: "backfilling",
    title: "Apache Airflow — DAG Runs and Backfill",
    url: "https://airflow.apache.org/docs/apache-airflow/stable/dag-run.html",
    resource_type: "docs",
  },
  {
    concept_slug: "backfilling",
    title: "dbt — Incremental models (backfill semantics)",
    url: "https://docs.getdbt.com/docs/build/incremental-models",
    resource_type: "docs",
  },

  // failure-modes
  {
    concept_slug: "failure-modes",
    title: "Apache Airflow — Tasks (retries, callbacks, trigger rules)",
    url: "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/tasks.html",
    resource_type: "docs",
  },
  {
    concept_slug: "failure-modes",
    title: "Google SRE Book — Handling Overload (graceful degradation, load shedding)",
    url: "https://sre.google/sre-book/handling-overload/",
    resource_type: "book",
  },

  // sla-for-data
  {
    concept_slug: "sla-for-data",
    title: "Google SRE Book — Service Level Objectives (SLI / SLO / SLA)",
    url: "https://sre.google/sre-book/service-level-objectives/",
    resource_type: "book",
  },
  {
    concept_slug: "sla-for-data",
    title: "Apache Airflow — DAG-level SLAs (`sla` parameter, `sla_miss_callback`)",
    url: "https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html",
    resource_type: "docs",
  },

  // ── Phase 5 ──────────────────────────────────────────
  // event-streams
  {
    concept_slug: "event-streams",
    title: "Apache Kafka — Documentation (the canonical event-log)",
    url: "https://kafka.apache.org/documentation/",
    resource_type: "docs",
  },
  {
    concept_slug: "event-streams",
    title: "Jay Kreps — \"The Log: What every software engineer should know about real-time data's unifying abstraction\"",
    url: "https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying",
    resource_type: "article",
  },

  // stream-processing
  {
    concept_slug: "stream-processing",
    title: "Apache Flink — Concepts (DataStream API, stateful processing)",
    url: "https://nightlies.apache.org/flink/flink-docs-master/docs/concepts/overview/",
    resource_type: "docs",
  },
  {
    concept_slug: "stream-processing",
    title: "Apache Spark — Structured Streaming Programming Guide",
    url: "https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html",
    resource_type: "docs",
  },

  // windowing
  {
    concept_slug: "windowing",
    title: "Apache Flink — Windows (tumbling, sliding, session)",
    url: "https://nightlies.apache.org/flink/flink-docs-master/docs/dev/datastream/operators/windows/",
    resource_type: "docs",
  },
  {
    concept_slug: "windowing",
    title: "Streaming Systems — Akidau, Chernyak, Lax (O'Reilly book)",
    url: "https://www.oreilly.com/library/view/streaming-systems/9781491983867/",
    resource_type: "book",
  },

  // time-and-ordering
  {
    concept_slug: "time-and-ordering",
    title: "Apache Flink — Time, Watermarks, and Lateness",
    url: "https://nightlies.apache.org/flink/flink-docs-master/docs/concepts/time/",
    resource_type: "docs",
  },
  {
    concept_slug: "time-and-ordering",
    title: "Tyler Akidau — \"The Dataflow Model\" (event time + watermarks, original paper)",
    url: "https://research.google/pubs/the-dataflow-model-a-practical-approach-to-balancing-correctness-latency-and-cost-in-massive-scale-unbounded-out-of-order-data-processing/",
    resource_type: "article",
  },

  // delivery-semantics
  {
    concept_slug: "delivery-semantics",
    title: "Confluent — Exactly-Once Semantics in Apache Kafka",
    url: "https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/",
    resource_type: "article",
  },
  {
    concept_slug: "delivery-semantics",
    title: "Apache Flink — End-to-End Exactly-Once Processing with Apache Kafka",
    url: "https://flink.apache.org/2018/02/28/an-overview-of-end-to-end-exactly-once-processing-in-apache-flink-with-apache-kafka-too/",
    resource_type: "article",
  },

  // state-management-in-streams
  {
    concept_slug: "state-management-in-streams",
    title: "Apache Flink — Stateful Stream Processing",
    url: "https://nightlies.apache.org/flink/flink-docs-master/docs/concepts/stateful-stream-processing/",
    resource_type: "docs",
  },
  {
    concept_slug: "state-management-in-streams",
    title: "Apache Flink — Checkpointing (distributed snapshots, Chandy-Lamport)",
    url: "https://nightlies.apache.org/flink/flink-docs-master/docs/ops/state/checkpoints/",
    resource_type: "docs",
  },

  // ── Phase 6 ──────────────────────────────────────────
  // columnar-vs-row-storage
  {
    concept_slug: "columnar-vs-row-storage",
    title: "Apache Parquet — Documentation (file format, encodings, row groups)",
    url: "https://parquet.apache.org/docs/",
    resource_type: "docs",
  },
  {
    concept_slug: "columnar-vs-row-storage",
    title: "Apache Arrow — Columnar Format Specification",
    url: "https://arrow.apache.org/docs/format/Columnar.html",
    resource_type: "docs",
  },
  {
    concept_slug: "columnar-vs-row-storage",
    title: "Daniel Abadi — \"Column-Stores vs. Row-Stores: How Different Are They Really?\" (foundational paper)",
    url: "https://15721.courses.cs.cmu.edu/spring2017/papers/15-vectorization2/p967-abadi.pdf",
    resource_type: "article",
  },

  // partitioning-and-clustering
  {
    concept_slug: "partitioning-and-clustering",
    title: "BigQuery — Partitioned and Clustered Tables (when to use which)",
    url: "https://cloud.google.com/bigquery/docs/partitioned-tables",
    resource_type: "docs",
  },
  {
    concept_slug: "partitioning-and-clustering",
    title: "Delta Lake — Z-Ordering (multi-dimensional clustering)",
    url: "https://docs.delta.io/latest/optimizations-oss.html#z-ordering-multi-dimensional-clustering",
    resource_type: "docs",
  },

  // distributed-compute-and-shuffle
  {
    concept_slug: "distributed-compute-and-shuffle",
    title: "Apache Spark — Performance Tuning (broadcast joins, shuffle, skew handling)",
    url: "https://spark.apache.org/docs/latest/sql-performance-tuning.html",
    resource_type: "docs",
  },
  {
    concept_slug: "distributed-compute-and-shuffle",
    title: "Dean & Ghemawat — \"MapReduce: Simplified Data Processing on Large Clusters\" (original Google paper)",
    url: "https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/",
    resource_type: "article",
  },
  {
    concept_slug: "distributed-compute-and-shuffle",
    title: "Trino — Query Execution and the Cost of Shuffles",
    url: "https://trino.io/docs/current/optimizer.html",
    resource_type: "docs",
  },

  // data-lake-warehouse-lakehouse
  {
    concept_slug: "data-lake-warehouse-lakehouse",
    title: "Apache Iceberg — Documentation (table format spec, time travel, schema evolution)",
    url: "https://iceberg.apache.org/docs/latest/",
    resource_type: "docs",
  },
  {
    concept_slug: "data-lake-warehouse-lakehouse",
    title: "Delta Lake — Documentation (transaction log, ACID, time travel)",
    url: "https://docs.delta.io/latest/index.html",
    resource_type: "docs",
  },
  {
    concept_slug: "data-lake-warehouse-lakehouse",
    title: "Databricks — \"Lakehouse: A New Generation of Open Platforms\" (CIDR 2021 paper)",
    url: "https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf",
    resource_type: "article",
  },

  // cost-as-performance
  {
    concept_slug: "cost-as-performance",
    title: "Google BigQuery — Pricing (per-byte-scanned model)",
    url: "https://cloud.google.com/bigquery/pricing",
    resource_type: "docs",
  },
  {
    concept_slug: "cost-as-performance",
    title: "Snowflake — Understanding Compute Cost (credits per warehouse-hour)",
    url: "https://docs.snowflake.com/en/user-guide/cost-understanding-compute",
    resource_type: "docs",
  },

  // ── Phase 7 ──────────────────────────────────────────
  // data-contracts
  {
    concept_slug: "data-contracts",
    title: "Andrew Jones — \"Driving Data Quality with Data Contracts\" (book / approach overview)",
    url: "https://www.oreilly.com/library/view/driving-data-quality/9781837635009/",
    resource_type: "book",
  },
  {
    concept_slug: "data-contracts",
    title: "Pact — Consumer-Driven Contract Testing (the SWE analogue applied across organizations)",
    url: "https://docs.pact.io/",
    resource_type: "docs",
  },
  {
    concept_slug: "data-contracts",
    title: "Confluent — Schema Registry (compatibility modes: backward / forward / full)",
    url: "https://docs.confluent.io/platform/current/schema-registry/index.html",
    resource_type: "docs",
  },

  // observability
  {
    concept_slug: "observability",
    title: "OpenLineage — Open standard for data lineage (the OpenTelemetry of data)",
    url: "https://openlineage.io/",
    resource_type: "docs",
  },
  {
    concept_slug: "observability",
    title: "DataHub — Open-source metadata + lineage platform",
    url: "https://datahubproject.io/docs/",
    resource_type: "docs",
  },
  {
    concept_slug: "observability",
    title: "Monte Carlo — \"The Five Pillars of Data Observability\" (freshness, volume, distribution, schema, lineage)",
    url: "https://www.montecarlodata.com/blog-what-is-data-observability/",
    resource_type: "article",
  },

  // governance
  {
    concept_slug: "governance",
    title: "Open Policy Agent (OPA) — Declarative policy-as-code",
    url: "https://www.openpolicyagent.org/docs/latest/",
    resource_type: "docs",
  },
  {
    concept_slug: "governance",
    title: "Snowflake — Dynamic Data Masking and Row Access Policies",
    url: "https://docs.snowflake.com/en/user-guide/security-column-intro",
    resource_type: "docs",
  },
  {
    concept_slug: "governance",
    title: "GDPR Right-to-Erasure — what immutable data systems actually have to solve",
    url: "https://gdpr-info.eu/art-17-gdpr/",
    resource_type: "article",
  },

  // self-serve-data
  {
    concept_slug: "self-serve-data",
    title: "Zhamak Dehghani — \"Data Mesh Principles and Logical Architecture\" (the foundational essay)",
    url: "https://martinfowler.com/articles/data-mesh-principles.html",
    resource_type: "article",
  },
  {
    concept_slug: "self-serve-data",
    title: "OpenMetadata — open-source data catalog (discovery + lineage + governance in one platform)",
    url: "https://docs.open-metadata.org/",
    resource_type: "docs",
  },
  {
    concept_slug: "self-serve-data",
    title: "Spotify Backstage — Internal Developer Platform model (the SWE analogue to a self-serve data platform)",
    url: "https://backstage.io/docs/overview/what-is-backstage",
    resource_type: "docs",
  },

  // breaking-changes
  {
    concept_slug: "breaking-changes",
    title: "Martin Fowler — \"Parallel Change\" (the expand-and-contract migration pattern)",
    url: "https://martinfowler.com/bliki/ParallelChange.html",
    resource_type: "article",
  },
  {
    concept_slug: "breaking-changes",
    title: "Apache Iceberg — Schema Evolution (rename/add/drop without rewriting historical files)",
    url: "https://iceberg.apache.org/docs/latest/evolution/",
    resource_type: "docs",
  },
];
