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
];
