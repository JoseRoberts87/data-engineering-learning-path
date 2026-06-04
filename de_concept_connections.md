# Concept connections — the 7-phase arc as one idea

This document maps the relationships between the 43 concepts in the curriculum. It's not a curriculum itself — the phases and concepts are the curriculum. This is the *meta* layer: the recurring laws, the cross-phase callbacks, the SWE-to-DE bridges, and the single journey arc that unifies the series.

If a learner reads only one summary after finishing all 7 phases, this is what it should say.

---

## 1. The throughline — one journey in seven steps

The 7 phases describe one journey:

> **Make correct data → move it reliably → store it efficiently → serve it as a trustworthy product.**

| Phase | One-line role | What it ends with that the next phase needs |
|---|---|---|
| **1. Thinking in data** | The mindset shift — data has *different* failure modes, time semantics, and feedback loops than code | The conviction that data is a product, not exhaust |
| **2. Data modeling** | The shape — how to lay out information so analytics can actually use it | A target schema worth moving data into |
| **3. Movement + transformation** | The mechanics — how to load and transform without losing or duplicating | A pipeline that produces correct data idempotently |
| **4. Orchestration + reliability** | The operations layer — how to keep many pipelines coordinated and recoverable | A control plane that survives failures |
| **5. Streaming** | The unbounded case — every Phase 3–4 problem, on data that never ends | The discipline of taking on streaming complexity only when freshness pays back |
| **6. Storage, scale, compute** | The physical floor — how the abstract decisions in P2–P5 cash out in bytes scanned and dollars spent | Cost-aware performance instincts |
| **7. Data platform thinking** | The organizational layer — how to make all of this work for people you'll never meet | Data Mesh: data-as-product, owned by domains, on a self-serve platform, under federated governance |

There are two complementary "laws" the series builds toward:

- **Phase 6's law (the physical bottleneck):** *At scale, performance is dominated by how much data you physically touch — and cloud pricing converts that physical reality directly into money.*
- **Phase 7's law (the organizational bottleneck):** *Once data is correct and cheap, the bottleneck moves from the machine to the organization, and the solutions move from algorithms to interfaces, policies, and products.*

The first six phases scale *data*. Phase 7 scales *people and trust*.

---

## 2. The recurring laws — themes that show up in every phase

These are the cross-cutting ideas that the curriculum builds in one phase and then keeps re-using.

### 2.1 Idempotency

The single most repeated lever in the series.

- **P1 — Idempotency as mindset.** Introduced as a *property of design*, not a runtime trick. "Wrong is worse than late" → reruns must be safe.
- **P3 — Idempotency.** The mechanical patterns: MERGE on natural key, partition overwrite, watermark columns.
- **P3 — Incremental loads.** Idempotent reprocessing of a window is what makes \"only the new data\" safe.
- **P4 — Backfilling.** Backfills are reruns over historical windows. They only work because the pipeline is idempotent.
- **P4 — Failure modes.** Retries with idempotent steps recover cleanly; retries against non-idempotent steps produce duplicates.
- **P5 — Delivery semantics.** "At-least-once + idempotent sink = effectively-once." The same idempotency, applied at the streaming boundary.
- **P5 — State management in streams.** Checkpointing's read-process-write atomicity is *the same problem* — solved by binding state+offset into one snapshot.

If you understand idempotency, six concepts collapse into one.

### 2.2 Time

Time is consistently the most underestimated source of bugs.

- **P1 — Time as engineering problem.** Event time ≠ ingestion time ≠ processing time ≠ partition time. Wall-clock is a footgun.
- **P4 — Backfilling.** "Don't use `now()` in transforms." Reprocessing March 15 should compute as if today were March 15.
- **P5 — Time and ordering.** Event time vs. processing time, formalized. Watermarks as the latency-vs-completeness dial.
- **P5 — Windowing.** Windows are how you make event time finite enough to aggregate.
- **P5 — Stream processing.** "Window by event time, never `now()`" is the same `now()` warning from P4, hardened by watermarks.

P1's intuition becomes P5's mechanism.

### 2.3 The log abstraction

A single data structure underlies more concepts than any other.

- **P3 — Change data capture.** "A database's WAL is an event stream." CDC reads the log.
- **P5 — Event streams.** The log as the central streaming abstraction — append-only, replayable, fan-out by offset.
- **P6 — Lakehouse table formats.** Iceberg / Delta / Hudi are *a transaction log + a file manifest*, laid over Parquet. "Git's commit log over a directory of files."
- **P2 — Slowly-changing dimensions.** SCD Type 2 is a per-row WAL with surrogate-key = commit hash.

WAL, binlog, event stream, lakehouse log, SCD log — same data structure, four contexts.

### 2.4 Immutability + versioning

The data world is fundamentally append-only — and that creates both gifts and curses.

- **P1 — Failures are backlogs / Time as engineering problem.** Append-only history is *why* late data can update old windows.
- **P2 — Slowly-changing dimensions.** "Keep the history" is the whole point.
- **P2 — Medallion architecture.** Bronze is raw and immutable; gold is derived and rebuildable.
- **P3 — ETL vs ELT.** ELT keeps raw forever so transforms can be replayed.
- **P5 — Event streams.** Replayability is the killer feature.
- **P6 — Lakehouse time travel.** `AS OF VERSION 42` because every prior version's manifest still exists.
- **P7 — Right-to-be-forgotten.** GDPR deletion is *hard exactly because* of immutability + replication. This is the only concept in the series with no clean SWE analogue.

The gift is replayability. The curse is GDPR.

### 2.5 Cost = bytes touched

The Phase 6 financial restatement of *every previous phase*.

- **P2 — Denormalization.** Avoids joins. Joins are shuffles. Shuffles dominate cost.
- **P3 — Incremental loads.** Process daily increment, not full table → 100x+ cost reduction.
- **P4 — SLA for data.** "Latency from the decision, not the data" — paying for low latency you don't use is paying for nothing.
- **P5 — Stream processing.** Streaming bills continuously; batch bills once. Pick the latency the consumer's decision actually needs.
- **P6 — Columnar, partitioning, clustering, cost-as-performance.** The formalization: every technique reduces bytes touched; bytes touched is what the cloud charges for.

The hidden truth of Phase 6: most of the earlier curriculum was already secretly about cost.

### 2.6 Stateless is easy, stateful is hard

The split that predicts where complexity lives.

- **P3 — Idempotency / transformation layering.** Stateless transforms compose trivially; stateful aggregations need watermarks and bookkeeping.
- **P5 — Stream processing.** The split is explicit: stateless (map/filter) is embarrassingly parallel; stateful (joins/aggregations/sessions) creates every hard problem in streaming.
- **P5 — State management in streams.** Durability, growth, scale — three properties that make state hard.
- **P6 — Distributed compute and shuffle.** The same split: map/filter are linearly parallel; GROUP BY/JOIN require shuffles.

When something is hard, it's usually because state is involved.

### 2.7 Backward compatibility for asynchronous consumers

The discipline of evolving without coordinated upgrades.

- **P1 — Schemas as contracts.** First introduction. Producer-consumer coupling is a real engineering problem.
- **P3 — Data quality as tests.** The runtime check that fails when the contract is broken.
- **P5 — Delivery semantics.** End-to-end exactly-once requires *every link* to participate; one non-transactional sink breaks the chain.
- **P7 — Data contracts / Breaking changes.** The full discipline: contracts capture semantics + SLAs; expand-and-contract is data's blue-green migration; consumers can't be force-upgraded.

P1's intuition matures into P7's platform discipline.

---

## 3. Cross-phase callbacks — explicit "this concept reuses that one" links

A list of the specific, traceable connections between concepts in different phases. Each line names a relationship that, if you noticed it, deepens both ends.

### Phase 1 ↔ later phases

- **Data is the product (P1) → Self-serve data (P7).** "Your dataset has customers" matures into "build the paved road for those customers."
- **Schemas as contracts (P1) → Data contracts (P7).** Schema enforcement is the mechanism; the contract is the social structure.
- **Failures are backlogs (P1) → Failure modes (P4) → Observability (P7).** The same instinct ("wrong is worse than late") industrialized phase by phase.
- **Idempotency as mindset (P1) → Idempotency (P3) → Delivery semantics (P5).** Mindset → pattern → distributed-systems guarantee.
- **Statistical testing (P1) → Data quality as tests (P3) → Observability (P7).** Sampling → executable assertions → platform-wide monitoring.
- **Time as engineering problem (P1) → Time and ordering (P5).** The intuition becomes the watermark machinery.
- **Batch vs real-time (P1) → Stream processing (P5) → Cost-as-performance (P6).** The latency/cost dial. P5 names the cost; P6 prices it.
- **Scale and cost as design axes (P1) → Cost-as-performance (P6).** Same idea; the entire Phase 6 chapter formalizes it.

### Phase 2 ↔ later phases

- **OLTP vs OLAP (P2) → Columnar vs row storage (P6).** Workload shape forces physical layout.
- **Normalization vs denormalization (P2) → Distributed compute and shuffle (P6).** Denormalizing avoids joins → avoids shuffles → avoids the dominant distributed-query cost.
- **Medallion architecture (P2) → Data lake vs warehouse vs lakehouse (P6).** Bronze ≈ lake; gold ≈ warehouse; the lakehouse formalizes both.
- **Slowly-changing dimensions (P2) → Lakehouse time travel (P6).** Two implementations of "keep history": application-level (SCD2) and storage-level (Iceberg/Delta snapshots).
- **Grain is everything (P2) → Breaking changes (P7).** "Changing the grain" is the most underrated breaking change.

### Phase 3 ↔ later phases

- **CDC (P3) → Event streams (P5).** A WAL is an event stream. Same data structure.
- **Idempotency (P3) → Delivery semantics (P5).** Effectively-once = at-least-once + idempotency at the streaming boundary.
- **Incremental loads (P3) → Backfilling (P4).** Incremental forward + idempotent backward = a complete update story.
- **Transformation layering (P3) → Stream processing (P5).** Staging → intermediate → mart is a dataflow topology, just bounded.
- **Data quality as tests (P3) → Observability (P7).** Tests run per pipeline; observability runs platform-wide.

### Phase 4 ↔ later phases

- **DAGs / Dependency management (P4) → Stream processing topology (P5).** Both are dataflow graphs. The orchestration DAG runs on a daily clock; the streaming topology runs forever.
- **Asset-centric orchestration (P4) → Data is the product (P1) → Self-serve data (P7).** Assets are products. Asset ownership is the substrate for catalogs, contracts, and self-serve.
- **SLA for data (P4) → Observability (P7).** Asset-level freshness policies, platform-wide.
- **Backfilling (P4) → Partitioning (P6).** Partition boundaries *are* backfill boundaries. The partition column you choose in P6 is the backfill granularity you live with in P4.
- **Failure modes (P4) → Delivery semantics (P5).** Same retry/idempotency/transactional logic, generalized to unbounded data.

### Phase 5 ↔ later phases

- **State management in streams (P5) → Lakehouse transactions (P6).** Two systems solving durable consistent state: Flink's distributed snapshots (Chandy-Lamport) and lakehouse transaction logs.
- **Event streams (P5) → Lakehouse table formats (P6).** Both built on the log abstraction. Iceberg's manifest log is structurally what Kafka does for events.
- **Delivery semantics (P5) → Idempotency (P3) → Data contracts (P7).** End-to-end exactly-once requires every link to participate, including the receiving contract.

### Phase 6 ↔ Phase 7

- **Cost-as-performance (P6) → Self-serve data (P7).** A self-serve platform that doesn't enforce cost guardrails creates a $50k surprise bill.
- **Lakehouse table formats (P6) → Right-to-be-forgotten (P7).** Time-travel makes GDPR deletion harder, not easier. Snapshots have to be GC'd to actually erase data.
- **Lakehouse schema evolution (P6) → Breaking changes (P7).** P6 provides the storage-level mechanism; P7 provides the social discipline.

---

## 4. The SWE-to-DE analogy map

The curriculum is consistently anchored to software-engineering parallels. Here's the master table of which SWE concept maps to which DE concept.

| SWE concept | DE concept | Phase |
|---|---|---|
| Public API + semver | Schemas as contracts / Data contracts | P1, P7 |
| Consumer-driven contract testing (Pact) | Data contract CI enforcement | P7 |
| Distributed tracing | Lineage (column-level) | P7 |
| Datadog / Sentry / metrics-logs-traces | Data observability (freshness / volume / distribution / lineage) | P7 |
| RBAC + OPA + audit logs | Governance | P7 |
| Spotify Backstage / Internal developer platform | Self-serve data platform | P7 |
| Blue-green / parallel-change | Expand-and-contract schema evolution | P7 |
| Git commit log | WAL / CDC / event stream / lakehouse transaction log | P3, P5, P6 |
| Git checkout `<commit>` | Lakehouse time travel | P6 |
| Git surrogate key = commit hash | SCD Type 2 | P2 |
| Idempotent REST + retries | At-least-once + idempotent sink | P3, P5 |
| Two-generals problem | "Exactly-once delivery is impossible" | P5 |
| Two-phase commit | Transactional exactly-once (Kafka transactions / Flink 2PC) | P5 |
| Reactive programming / Unix pipes that never close | Stream processing topology | P5 |
| Cache locality / mechanical sympathy | Data locality / minimize shuffle | P6 |
| Local lookup vs remote service call | Map/filter vs shuffle (broadcast vs sort-merge join) | P6 |
| Struct-of-arrays vs array-of-structs | Columnar vs row storage | P6 |
| Gzipping a network payload | Columnar compression (I/O bottleneck, CPU cheap) | P6 |
| Composite (multi-column) index | Z-ordering | P6 |
| Static vs dynamic typing | Schema-on-write vs schema-on-read | P6 |
| Hot shard / one tenant dominates traffic | Data skew in distributed queries | P6 |
| Big-O thinking | "Big-O where the units are dollars" | P6 |
| Maven / Gradle / Bazel build dependency graph | DAG with time-partitioned dependencies | P4 |
| Cron + retries + on-call | Orchestrator (Airflow / Prefect / Dagster) | P4 |
| Dead-letter queue | Quarantine table for bad rows | P3 |
| Adapter + dependency inversion | Staging → intermediate → mart layering | P3 |
| Terraform / Kubernetes (declarative end state) | dbt | P3 |
| HTTP PUT vs POST | MERGE/UPSERT vs INSERT | P3 |
| Server vs script | Streaming topology vs batch job | P5 |
| HashMap<UserId, SessionState> | Keyed state in stream processors | P5 |

The two genuinely-novel problems with no clean SWE analogue:

- **Right-to-be-forgotten against immutable, replicated storage** (P7 — governance). Application databases delete trivially; the data world's substrate is *built on the opposite of erasure*.
- **Semantic breaks that pass type checks** (P7 — breaking changes). The structural type matches; the meaning has shifted under it. Code-land has units bugs (foot-pounds vs newton-meters); data-land has these every day.

---

## 5. The synthesis — what the series actually teaches

Read in sequence, the seven phases tell one story:

**P1 → P2 → P3:** *individual craft.* You learn to think in data, model it, and move it correctly. The unit of work is "one dataset, one pipeline, one engineer."

**P4 → P5:** *coordinated craft.* You learn to operate many pipelines at once (P4), and to handle the genuinely-different problem of unbounded data (P5). The unit of work becomes "a system of pipelines."

**P6:** *physical reality.* You learn that everything above has a price tag, and that the abstract decisions you made cash out in bytes-scanned and dollars-spent. The unit becomes "a query, priced."

**P7:** *organizational reality.* You learn that none of this matters at scale unless people who didn't build it can use it safely. The unit becomes "a data product, consumed by an org."

The same maturation happened in software engineering: from "write good code" → "build good systems" → "build the platform so the whole org writes good code." Phase 7 isn't pretending this is the destination; it's noting that *we already know what this destination looks like*, because software engineering arrived there a decade earlier.

The integrative claim of the entire curriculum: **the hard problems of data engineering aren't different in kind from the hard problems of software engineering — they're the same problems, with different physics (bytes, immutability, replication) and a different cost function (the cloud bill).** Recognizing the SWE analogue isn't a teaching crutch; it's the actual epistemic shortcut, because the discipline of software engineering has already worked out most of the patterns you need.

What's *uniquely* data, with no good code analogue:

- **GDPR right-to-erasure against an append-only, replicated substrate.** P7.
- **Semantic breaks that pass type checks** (revenue used to be gross; now it's net). P7.
- **Event-time correctness with late, out-of-order data.** P1, P5.
- **Cost-as-performance** at the granularity of individual queries. P6.

Those four are the parts of data engineering that aren't ported from somewhere else. Everything else, surprisingly, has a precedent.

---

## 6. How to use this document

This is a *reference*, not a curriculum. The expected workflow:

- Read it once after finishing each phase to anchor that phase to the rest.
- Re-read Section 2 (the recurring laws) when something in a later phase feels familiar — it probably is, in a different costume.
- Use Section 3 (cross-phase callbacks) when teaching others: "this concept is just *that one*, scaled up."
- Use Section 4 (the SWE-to-DE map) when explaining DE to a software engineer.
- Use Section 5 (the synthesis) when deciding what to focus on next: each phase is a *level*, not a topic.

The biggest implicit lesson: **the series is one idea taught seven times, at increasing scales.** Data is a product; that product has a contract; that contract has a price; that price has an organization. Everything else is implementation.
