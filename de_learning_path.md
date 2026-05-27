# Data Engineering Learning Path for Software Engineers

---

## 1 — Thinking in data, not requests
*The core mindset shift from SWE to DE*

- Data is the product, not a side effect — your job is to make it reliable and usable
- Batch vs. real-time processing — like choosing sync vs. async execution models
- Understanding data consumers — analysts and ML models, not APIs and UIs
- Schemas as contracts — like interface definitions, but for data shape over time

---

## 2 — Data modeling fundamentals
*How data is structured for reads at scale, not writes*

- Normalization vs. denormalization — the tension between DRY and query speed
- Dimensional modeling — organizing facts and context, like events and their metadata
- Slowly changing dimensions — versioning data over time, like git history for records
- OLTP vs. OLAP — transactional DBs (row-optimized) vs. analytical DBs (column-optimized)
- Data vault & medallion patterns — layered architecture, like clean/domain separation in SWE

---

## 3 — Data movement and transformation
*ETL/ELT patterns and building reliable pipelines*

- ETL vs. ELT — transform before or after loading; tradeoffs in where compute lives
- Idempotency — pipelines should be safe to re-run, like idempotent API endpoints
- Incremental vs. full loads — like diffing vs. full rebuilds; choose based on scale
- Data quality & testing — unit/integration tests for data, catching bad rows early
- Transformation logic — SQL-based or code-based; separating raw from curated layers

---

## 4 — Pipeline orchestration and reliability
*Scheduling, dependencies, failure handling at scale*

- DAGs (directed acyclic graphs) — like a build dependency tree, but for data jobs
- Dependency management — task B can't run until task A succeeds; topological ordering
- Backfilling — re-processing historical data, like replaying an event log
- Failure modes: retries, dead-letter queues, alerting — similar to distributed system patterns
- SLAs for data — data freshness and completeness guarantees, like API uptime contracts

---

## 5 — Streaming and event-driven data
*Processing data in motion, not just at rest*

- Event streams — like a persistent, replayable message queue with ordering guarantees
- Stream processing — applying transformations to data as it arrives, not after
- Windowing — aggregating over time windows, like rate limiting or rolling averages
- Exactly-once vs. at-least-once semantics — same tradeoffs as distributed transactions
- State management in streams — maintaining context across events, like session tracking

---

## 6 — Storage, scale, and compute
*How data is physically stored and queried at large scale*

- Columnar vs. row storage — optimized for scan patterns, not point lookups
- Partitioning and clustering — like sharding, but for query pruning instead of write scale
- Distributed compute — splitting work across nodes; data locality matters like cache locality
- Data lake vs. warehouse — raw flexible storage vs. structured queryable storage
- Cost vs. performance — scan costs money; good modeling is an optimization problem

---

## 7 — Data platform thinking
*Treating data infrastructure as a product for internal users*

- Data contracts — formal agreements between producers and consumers; like API versioning
- Observability — lineage, freshness, anomaly detection; like distributed tracing for data
- Governance — access control, PII handling, audit trails; like RBAC and compliance in SWE
- Self-serve data — building systems others can query safely, not just pipelines for yourself
- Breaking changes — schema evolution is a versioning problem; backward compat matters
