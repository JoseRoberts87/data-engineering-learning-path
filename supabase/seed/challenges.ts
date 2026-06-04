// Code challenges — seeded into code_challenges (one row per concept that
// has a challenge). MVP set: 7 challenges across Phases 2, 3, 5.
//
// Each challenge ends in a SELECT whose rows are compared against
// expected_result. For challenges that emit timestamps or dates, the
// SELECT casts to VARCHAR so the JSON expected can use plain strings
// without timezone ambiguity.

export type ChallengeSeed = {
  concept_slug: string;
  prompt: string;
  fixture_sql: string;
  starter_sql: string;
  expected_result: Array<Record<string, unknown>>;
  sample_solution: string;
  grading_notes: string;
  hints: string[];
};

export const challenges: ChallengeSeed[] = [
  // ─────────────────────────────────────────────────────
  // P3 — Idempotency
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "idempotency",
    prompt:
      "An ingestion pipeline loads new orders from `staging_orders` into `orders`. Write SQL that (a) adds new rows, (b) updates any existing orders whose data has changed, and (c) is safe to re-run on the same input without creating duplicates. End your code with the verification SELECT (don't change it).",
    fixture_sql: `CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  amount DECIMAL(10,2),
  status TEXT
);
INSERT INTO orders VALUES (100, 49.99, 'pending');

CREATE TABLE staging_orders (
  order_id INT,
  amount DECIMAL(10,2),
  status TEXT
);
INSERT INTO staging_orders VALUES
  (100, 49.99, 'shipped'),   -- existing order, status changed
  (101, 25.50, 'pending'),   -- new order
  (102, 100.00, 'paid');     -- new order`,
    starter_sql: `-- Your code here:


-- Verification (leave this; don't change):
SELECT order_id, amount, status FROM orders ORDER BY order_id;`,
    expected_result: [
      { order_id: 100, amount: 49.99, status: "shipped" },
      { order_id: 101, amount: 25.5, status: "pending" },
      { order_id: 102, amount: 100, status: "paid" },
    ],
    sample_solution: `INSERT INTO orders (order_id, amount, status)
SELECT order_id, amount, status FROM staging_orders
ON CONFLICT (order_id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status;

SELECT order_id, amount, status FROM orders ORDER BY order_id;`,
    grading_notes:
      "Reward: ON CONFLICT pattern (or MERGE), correct use of EXCLUDED, single statement. Penalize: pure INSERT (would fail on re-run with the unique constraint), DELETE-then-INSERT (acceptable but less ideal — call out as a 'gap'), missing the update of order 100's status (functional fail). A solution that hardcodes order_id values is a bigger conceptual fail than a missing edge case.",
    hints: [
      "DuckDB supports `INSERT ... ON CONFLICT (key) DO UPDATE SET col = EXCLUDED.col`.",
      "Re-running your statement against the same staging table should produce the same final state — that's the test of idempotency.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P2 — Slowly-changing dimensions (Type 2)
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "slowly-changing-dimensions",
    prompt:
      "Customer 100's billing address changed from `100 Main St, Providence` to `500 Hope St, Providence` on 2026-06-04. Update `dim_customers` Type-2 style: close the old row (set `valid_to` and `is_current = FALSE`) and insert a new row for the change.",
    fixture_sql: `CREATE TABLE dim_customers (
  customer_id INT,
  address TEXT,
  valid_from DATE,
  valid_to DATE,
  is_current BOOLEAN
);
INSERT INTO dim_customers VALUES
  (100, '100 Main St, Providence', '2025-01-01', NULL, TRUE),
  (101, '200 Elm St, Boston', '2025-01-01', NULL, TRUE);`,
    starter_sql: `-- Your code here:


-- Verification (cast dates to VARCHAR for stable comparison):
SELECT
  customer_id,
  address,
  valid_from::VARCHAR AS valid_from,
  valid_to::VARCHAR AS valid_to,
  is_current
FROM dim_customers
WHERE customer_id = 100
ORDER BY valid_from;`,
    expected_result: [
      {
        customer_id: 100,
        address: "100 Main St, Providence",
        valid_from: "2025-01-01",
        valid_to: "2026-06-03",
        is_current: false,
      },
      {
        customer_id: 100,
        address: "500 Hope St, Providence",
        valid_from: "2026-06-04",
        valid_to: null,
        is_current: true,
      },
    ],
    sample_solution: `UPDATE dim_customers
SET valid_to = DATE '2026-06-03', is_current = FALSE
WHERE customer_id = 100 AND is_current = TRUE;

INSERT INTO dim_customers VALUES
  (100, '500 Hope St, Providence', DATE '2026-06-04', NULL, TRUE);

SELECT customer_id, address, valid_from::VARCHAR AS valid_from,
  valid_to::VARCHAR AS valid_to, is_current
FROM dim_customers WHERE customer_id = 100 ORDER BY valid_from;`,
    grading_notes:
      "Reward: clean two-step (UPDATE old row + INSERT new row), correct valid_to = day before new valid_from, correct is_current flag. Penalize: changing the address in place (defeats SCD2), forgetting is_current update, valid_to set to same date as valid_from (overlap). A passing functional test means the rows are right; AI scoring focuses on whether the *approach* is the SCD2 pattern vs an in-place update with extra columns.",
    hints: [
      "You need TWO statements: an UPDATE to close the old row, then an INSERT for the new one.",
      "Old row's valid_to should be the day before the new row's valid_from.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P3 — Incremental vs. full loads
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "incremental-vs-full-loads",
    prompt:
      "A pipeline loads events from `events` into `events_loaded` on a schedule. Write a SELECT that returns only the events not yet loaded, using `event_id` as the watermark.",
    fixture_sql: `CREATE TABLE events (
  event_id INT,
  occurred_at TIMESTAMP,
  user_id INT,
  event_type TEXT
);
INSERT INTO events VALUES
  (1, '2026-06-04 09:00:00', 100, 'click'),
  (2, '2026-06-04 09:05:00', 101, 'view'),
  (3, '2026-06-04 09:10:00', 100, 'purchase'),
  (4, '2026-06-04 09:15:00', 102, 'click'),
  (5, '2026-06-04 09:20:00', 101, 'view'),
  (6, '2026-06-04 09:25:00', 103, 'click'),
  (7, '2026-06-04 09:30:00', 104, 'view'),
  (8, '2026-06-04 09:35:00', 100, 'view'),
  (9, '2026-06-04 09:40:00', 105, 'purchase'),
  (10, '2026-06-04 09:45:00', 102, 'view');

CREATE TABLE events_loaded (
  event_id INT,
  loaded_at TIMESTAMP
);
INSERT INTO events_loaded
SELECT event_id, TIMESTAMP '2026-06-04 10:00:00' FROM events WHERE event_id <= 6;`,
    starter_sql: `-- Return: event_id, occurred_at (as text), user_id, event_type
-- Keep occurred_at::VARCHAR so the test can compare cleanly.

SELECT
  event_id,
  occurred_at::VARCHAR AS occurred_at,
  user_id,
  event_type
FROM events
-- TODO: add a WHERE clause that returns only events past the watermark
ORDER BY event_id;`,
    expected_result: [
      { event_id: 7, occurred_at: "2026-06-04 09:30:00", user_id: 104, event_type: "view" },
      { event_id: 8, occurred_at: "2026-06-04 09:35:00", user_id: 100, event_type: "view" },
      { event_id: 9, occurred_at: "2026-06-04 09:40:00", user_id: 105, event_type: "purchase" },
      { event_id: 10, occurred_at: "2026-06-04 09:45:00", user_id: 102, event_type: "view" },
    ],
    sample_solution: `SELECT
  event_id,
  occurred_at::VARCHAR AS occurred_at,
  user_id,
  event_type
FROM events
WHERE event_id > (SELECT COALESCE(MAX(event_id), 0) FROM events_loaded)
ORDER BY event_id;`,
    grading_notes:
      "Reward: scalar subquery for the watermark, COALESCE for empty-target safety. Acceptable: LEFT JOIN ... IS NULL (anti-join pattern works but isn't the watermark idiom — note as 'gap' but still pass functionally). Penalize: hardcoding the value 6, no ordering, ignoring the watermark and returning all events.",
    hints: [
      "The watermark is the max event_id already in events_loaded.",
      "Use a scalar subquery: `WHERE event_id > (SELECT MAX(event_id) FROM events_loaded)`.",
      "COALESCE handles the case where events_loaded is empty.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P3 — Change data capture
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "change-data-capture",
    prompt:
      "`customer_changes` is a log of insert/update/delete operations applied to a customers table, in `change_seq` order. Write a SELECT that returns the CURRENT state of customers (after all changes), as `customer_id, name, email`, sorted by `customer_id`.",
    fixture_sql: `CREATE TABLE customer_changes (
  change_seq INT,
  op_type TEXT,     -- 'insert', 'update', 'delete'
  customer_id INT,
  name TEXT,
  email TEXT
);
INSERT INTO customer_changes VALUES
  (1, 'insert', 100, 'Alice',  'alice@example.com'),
  (2, 'insert', 101, 'Bob',    'bob@example.com'),
  (3, 'update', 100, 'Alice',  'alice@newdomain.com'),
  (4, 'insert', 102, 'Carol',  'carol@example.com'),
  (5, 'delete', 101, NULL,     NULL),
  (6, 'update', 100, 'Alicia', 'alicia@newdomain.com');`,
    starter_sql: `-- For each customer_id, find the LAST change in change_seq order.
-- If that last op is 'delete', exclude the customer.
-- Return current customers as customer_id, name, email.

`,
    expected_result: [
      { customer_id: 100, name: "Alicia", email: "alicia@newdomain.com" },
      { customer_id: 102, name: "Carol", email: "carol@example.com" },
    ],
    sample_solution: `WITH latest AS (
  SELECT
    customer_id, op_type, name, email,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY change_seq DESC) AS rn
  FROM customer_changes
)
SELECT customer_id, name, email
FROM latest
WHERE rn = 1 AND op_type <> 'delete'
ORDER BY customer_id;`,
    grading_notes:
      "Reward: ROW_NUMBER() OVER (PARTITION BY ... ORDER BY change_seq DESC), or equivalent window-function approach. Acceptable: correlated subquery for max(change_seq) per customer (works but verbose). Penalize: ignoring op_type='delete' (would include deleted customers), assuming the last insert wins instead of the last op of any type, manually filtering by hardcoded customer_ids.",
    hints: [
      "Use ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY change_seq DESC) to label each customer's most recent change.",
      "Filter out rows where the latest op_type is 'delete'.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P3 — Data quality as tests
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "data-quality-as-tests",
    prompt:
      "Write a single query that returns one row per data-quality issue found in `orders`. Issues to check: NULL customer_id, duplicate order_id, negative amount. Result columns: `issue_type` (text), `row_count` (int). Sort by `issue_type` alphabetically.",
    fixture_sql: `CREATE TABLE orders (
  order_id INT,
  customer_id INT,
  amount DECIMAL(10,2)
);
INSERT INTO orders VALUES
  (1, 100, 49.99),
  (2, 101, 25.00),
  (3, NULL, 30.00),   -- null customer
  (4, 102, -15.00),   -- negative
  (5, 103, 100.00),
  (5, 104, 75.00),    -- duplicate id
  (6, NULL, 20.00),   -- null customer
  (7, 105, -5.00);    -- negative`,
    starter_sql: `-- Return one row per issue with its count.
-- issue_type values to use: 'null_customer_id', 'duplicate_order_id', 'negative_amount'

`,
    expected_result: [
      { issue_type: "duplicate_order_id", row_count: 2 },
      { issue_type: "negative_amount", row_count: 2 },
      { issue_type: "null_customer_id", row_count: 2 },
    ],
    sample_solution: `SELECT 'null_customer_id' AS issue_type, COUNT(*) AS row_count
FROM orders WHERE customer_id IS NULL
UNION ALL
SELECT 'duplicate_order_id', COUNT(*)
FROM orders
WHERE order_id IN (
  SELECT order_id FROM orders GROUP BY order_id HAVING COUNT(*) > 1
)
UNION ALL
SELECT 'negative_amount', COUNT(*)
FROM orders WHERE amount < 0
ORDER BY issue_type;`,
    grading_notes:
      "Reward: UNION ALL of three checks, IS NULL for null check, GROUP BY ... HAVING for duplicates, comparison for negatives. Penalize: counting distinct duplicate keys (1) instead of rows-involved (2) — both are defensible interpretations but the prompt asks for row_count. Penalize: forgetting the alphabetical sort, mixing up issue_type labels.",
    hints: [
      "Use UNION ALL to combine three separate counts into one result.",
      "For duplicates, `GROUP BY order_id HAVING COUNT(*) > 1` finds the keys; then count the rows involved with those keys.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P3 — Transformation layering
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "transformation-layering",
    prompt:
      "Using CTEs, build a layered transformation from raw → staging → intermediate → mart. Stages: (1) rename columns + cast types; (2) aggregate sum(amount) per customer per day; (3) filter to customers who have orders on more than one distinct day. Return columns: `customer_id`, `order_date`, `daily_total`. Order by customer_id, order_date.",
    fixture_sql: `CREATE TABLE raw_orders (
  ord_id INT,
  cust INT,
  amt VARCHAR,
  created VARCHAR
);
INSERT INTO raw_orders VALUES
  (1, 100, '49.99',  '2026-06-01 10:00:00'),
  (2, 100, '25.00',  '2026-06-01 14:30:00'),
  (3, 101, '30.00',  '2026-06-01 11:00:00'),
  (4, 100, '100.00', '2026-06-02 09:00:00'),
  (5, 102, '15.00',  '2026-06-01 13:00:00'),
  (6, 101, '20.00',  '2026-06-02 08:00:00');`,
    starter_sql: `-- staging:       rename + cast (ord_id -> order_id, etc.)
-- intermediate: SUM(amount) per (customer_id, order_date)
-- mart:         only customers active on > 1 distinct day
-- Output columns: customer_id, order_date (as VARCHAR), daily_total

`,
    expected_result: [
      { customer_id: 100, order_date: "2026-06-01", daily_total: 74.99 },
      { customer_id: 100, order_date: "2026-06-02", daily_total: 100 },
      { customer_id: 101, order_date: "2026-06-01", daily_total: 30 },
      { customer_id: 101, order_date: "2026-06-02", daily_total: 20 },
    ],
    sample_solution: `WITH staging AS (
  SELECT
    ord_id AS order_id,
    cust AS customer_id,
    CAST(amt AS DECIMAL(10,2)) AS amount,
    CAST(created AS TIMESTAMP) AS created_at
  FROM raw_orders
),
intermediate AS (
  SELECT
    customer_id,
    CAST(created_at AS DATE) AS order_date,
    SUM(amount) AS daily_total
  FROM staging
  GROUP BY customer_id, CAST(created_at AS DATE)
),
mart AS (
  SELECT *
  FROM intermediate
  WHERE customer_id IN (
    SELECT customer_id
    FROM intermediate
    GROUP BY customer_id
    HAVING COUNT(DISTINCT order_date) > 1
  )
)
SELECT customer_id, order_date::VARCHAR AS order_date, daily_total
FROM mart
ORDER BY customer_id, order_date;`,
    grading_notes:
      "Reward: clearly named CTEs (staging/intermediate/mart or equivalents), separation of concerns by layer, casting in the staging stage. Penalize: doing everything in one big query (skips the layering concept), no cast (relying on implicit), incorrect filter (e.g., HAVING COUNT(*) > 1 instead of COUNT(DISTINCT order_date) > 1 — won't catch the multi-day requirement when a customer has 2 orders on the same day).",
    hints: [
      "Three CTEs, one per stage. The mart filter needs DISTINCT order_date in its HAVING.",
      "Customer 102 has only one order; the mart should exclude them.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P1 — Time as engineering problem
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "time-as-engineering-problem",
    prompt:
      "Events arrive with both `event_time` (when the event actually happened) and `ingested_at` (when our system received it). Compute hourly event counts BY EVENT TIME, so a late-arriving event lands in its correct historical bucket. Return `event_hour` (VARCHAR) and `event_count`, ordered by event_hour.",
    fixture_sql: `CREATE TABLE events (
  event_id INT,
  event_time TIMESTAMP,
  ingested_at TIMESTAMP
);
INSERT INTO events VALUES
  (1, '2026-06-04 09:15:00', '2026-06-04 09:20:00'),
  (2, '2026-06-04 09:45:00', '2026-06-04 09:50:00'),
  (3, '2026-06-04 09:55:00', '2026-06-04 10:30:00'),  -- late by 35 min
  (4, '2026-06-04 10:05:00', '2026-06-04 10:10:00'),
  (5, '2026-06-04 10:30:00', '2026-06-04 10:35:00'),
  (6, '2026-06-04 10:50:00', '2026-06-04 11:45:00'),  -- late by 55 min
  (7, '2026-06-04 11:10:00', '2026-06-04 11:15:00');`,
    starter_sql: `-- Group by event_time, NOT ingested_at and NOT now().
-- Event 3 belongs in the 09:00 bucket; event 6 belongs in the 10:00 bucket.
-- Return event_hour as VARCHAR and event_count.

`,
    expected_result: [
      { event_hour: "2026-06-04 09:00:00", event_count: 3 },
      { event_hour: "2026-06-04 10:00:00", event_count: 3 },
      { event_hour: "2026-06-04 11:00:00", event_count: 1 },
    ],
    sample_solution: `SELECT
  date_trunc('hour', event_time)::VARCHAR AS event_hour,
  COUNT(*) AS event_count
FROM events
GROUP BY date_trunc('hour', event_time)
ORDER BY event_hour;`,
    grading_notes:
      "Reward: grouping by event_time via date_trunc('hour', ...). Penalize HARD: using ingested_at (the whole point of the concept is event-time vs processing-time), using now()/CURRENT_TIMESTAMP (smears wall-clock into historical data), using HOUR(event_time) alone (drops the date, would collapse different days into the same bucket).",
    hints: [
      "Use date_trunc('hour', event_time) — and ONLY event_time, never ingested_at or now().",
      "Event 3 was ingested at 10:30 but happened at 09:55 — it belongs in the 09:00 hour bucket.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P2 — Normalization vs denormalization
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "normalization-vs-denormalization",
    prompt:
      "Denormalize `orders` by pre-joining `customers` so the resulting rows carry the customer name and country inline. This is the analytical pattern: do the JOIN once at write time so every downstream query doesn't pay for it.",
    fixture_sql: `CREATE TABLE customers (
  customer_id INT PRIMARY KEY,
  name TEXT,
  country TEXT
);
INSERT INTO customers VALUES
  (100, 'Alice', 'US'),
  (101, 'Bob',   'UK'),
  (102, 'Carol', 'US');

CREATE TABLE orders (
  order_id INT,
  customer_id INT,
  amount DECIMAL(10,2),
  ordered_at DATE
);
INSERT INTO orders VALUES
  (1, 100, 49.99,  '2026-06-01'),
  (2, 100, 25.50,  '2026-06-02'),
  (3, 101, 100.00, '2026-06-02'),
  (4, 102, 75.00,  '2026-06-03'),
  (5, 101, 30.00,  '2026-06-03');`,
    starter_sql: `-- Return: order_id, customer_name, country, amount, ordered_at (VARCHAR).
-- Sort by order_id.

`,
    expected_result: [
      { order_id: 1, customer_name: "Alice", country: "US", amount: 49.99, ordered_at: "2026-06-01" },
      { order_id: 2, customer_name: "Alice", country: "US", amount: 25.5, ordered_at: "2026-06-02" },
      { order_id: 3, customer_name: "Bob", country: "UK", amount: 100, ordered_at: "2026-06-02" },
      { order_id: 4, customer_name: "Carol", country: "US", amount: 75, ordered_at: "2026-06-03" },
      { order_id: 5, customer_name: "Bob", country: "UK", amount: 30, ordered_at: "2026-06-03" },
    ],
    sample_solution: `SELECT
  o.order_id,
  c.name AS customer_name,
  c.country,
  o.amount,
  o.ordered_at::VARCHAR AS ordered_at
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
ORDER BY o.order_id;`,
    grading_notes:
      "Reward: INNER JOIN on customer_id, AS aliasing to surface clean column names, projection of only the needed columns. Acceptable: LEFT JOIN (works the same here since the FK is enforced). Penalize: subquery per row (CORRELATED) — works but is the anti-pattern denormalization is designed to avoid; SELECT * (would carry duplicate customer_id columns).",
    hints: [
      "INNER JOIN orders to customers on customer_id, then SELECT the columns you want denormalized.",
      "Alias customer columns clearly (e.g., `c.name AS customer_name`).",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P2 — Dimensional modeling
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "dimensional-modeling",
    prompt:
      "Build a star schema from `raw_orders`: a `dim_customers` CTE with unique customer attributes, a `fact_orders` CTE with the order grain plus a foreign key to dim. Then return revenue per country by joining fact → dim. Result: `country`, `total_revenue`, sorted alphabetically.",
    fixture_sql: `CREATE TABLE raw_orders (
  order_id INT,
  customer_id TEXT,
  customer_name TEXT,
  customer_country TEXT,
  amount DECIMAL(10,2)
);
INSERT INTO raw_orders VALUES
  (1, 'C-100', 'Alice', 'US', 49.99),
  (2, 'C-100', 'Alice', 'US', 25.50),
  (3, 'C-101', 'Bob',   'UK', 100.00),
  (4, 'C-102', 'Carol', 'US', 75.00),
  (5, 'C-101', 'Bob',   'UK', 30.00);`,
    starter_sql: `-- Step 1: dim_customers — DISTINCT customer_id, name, country
-- Step 2: fact_orders — order_id, customer_id (FK), amount (no name/country!)
-- Step 3: SELECT country, SUM(amount) AS total_revenue from fact JOIN dim

WITH dim_customers AS (
  -- TODO
),
fact_orders AS (
  -- TODO
)
SELECT ...`,
    expected_result: [
      { country: "UK", total_revenue: 130 },
      { country: "US", total_revenue: 150.49 },
    ],
    sample_solution: `WITH dim_customers AS (
  SELECT DISTINCT customer_id, customer_name AS name, customer_country AS country
  FROM raw_orders
),
fact_orders AS (
  SELECT order_id, customer_id, amount
  FROM raw_orders
)
SELECT
  d.country,
  SUM(f.amount) AS total_revenue
FROM fact_orders f
JOIN dim_customers d ON f.customer_id = d.customer_id
GROUP BY d.country
ORDER BY d.country;`,
    grading_notes:
      "Reward: clear separation — dim_customers carries entity attributes (the nouns), fact_orders carries events (the verbs) with only the FK to dim. SELECT DISTINCT on dim is the right way to deduplicate. Penalize: putting customer_name/country in fact_orders (defeats the schema — those columns belong in dim), no JOIN in the final SELECT (just GROUP BY raw_orders directly — works but doesn't demonstrate the modeling).",
    hints: [
      "dim_customers uses SELECT DISTINCT to get one row per unique customer.",
      "fact_orders should NOT carry name or country — only the FK (customer_id) to dim.",
      "The final SELECT joins fact to dim to get country, then GROUP BY country.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P2 — Grain is everything
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "grain-is-everything",
    prompt:
      "`order_line_items` has one row per line item. You want **average revenue per ORDER**, not per line item. Compute it correctly — aggregate to the order grain first, then average. (Hint: `AVG(amount)` directly on the table gives you the wrong answer because it's at the wrong grain.)",
    fixture_sql: `CREATE TABLE order_line_items (
  order_id INT,
  line_id INT,
  amount DECIMAL(10,2)
);
INSERT INTO order_line_items VALUES
  (1, 1,  30.00),
  (1, 2,  20.00),
  (2, 1,  10.00),
  (3, 1,  15.00),
  (3, 2,   5.00),
  (4, 1, 100.00);`,
    starter_sql: `-- AVG(amount) on this table = 30.00 (average per LINE ITEM, wrong grain!)
-- Correct average revenue per ORDER = (50 + 10 + 20 + 100) / 4 = 45.00
--
-- Return one row with column avg_revenue_per_order.

`,
    expected_result: [{ avg_revenue_per_order: 45 }],
    sample_solution: `SELECT AVG(order_total) AS avg_revenue_per_order
FROM (
  SELECT order_id, SUM(amount) AS order_total
  FROM order_line_items
  GROUP BY order_id
) order_grain;`,
    grading_notes:
      "Reward: nested aggregation (subquery or CTE) that aggregates to order grain first, THEN averages. Penalize HARD: \"SELECT AVG(amount) FROM order_line_items\" — that's the grain bug the challenge is designed to teach (returns 30.00, not 45.00). Penalize: SUM(amount) / COUNT(DISTINCT order_id) — works arithmetically but misses the point about grain.",
    hints: [
      "AVG(amount) directly = 30.00 (per line item). You need 45.00 (per order).",
      "Use a CTE or subquery: aggregate SUM(amount) per order_id first, then AVG over those order totals.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P2 — Medallion architecture
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "medallion-architecture",
    prompt:
      "`bronze_events` is raw landed data with messy types, NULLs, and duplicates. Build the medallion stack: a `silver` CTE that cleans + casts (drop NULL user_ids, dedup), then a `gold` CTE that aggregates to daily KPIs. Return `event_date` (VARCHAR), `event_count`, `distinct_users`, sorted by event_date.",
    fixture_sql: `CREATE TABLE bronze_events (
  raw_id VARCHAR,
  event_type VARCHAR,
  user_id VARCHAR,
  occurred_at VARCHAR
);
INSERT INTO bronze_events VALUES
  ('1', 'click',    '100', '2026-06-01 09:00:00'),
  ('2', 'view',     '101', '2026-06-01 10:00:00'),
  ('2', 'view',     '101', '2026-06-01 10:00:00'),  -- dup
  ('3', 'purchase', '102', '2026-06-01 11:00:00'),
  ('4', 'click',    NULL,  '2026-06-02 09:00:00'),  -- null user_id
  ('5', 'view',     '100', '2026-06-02 10:00:00'),
  ('6', 'click',    '103', '2026-06-02 11:00:00'),
  ('7', 'view',     '102', '2026-06-02 12:00:00');`,
    starter_sql: `-- silver: SELECT DISTINCT, cast types, drop NULL user_id
-- gold:   GROUP BY DATE(occurred_at) → event_count, distinct_users

`,
    expected_result: [
      { event_date: "2026-06-01", event_count: 3, distinct_users: 3 },
      { event_date: "2026-06-02", event_count: 3, distinct_users: 3 },
    ],
    sample_solution: `WITH silver_events AS (
  SELECT DISTINCT
    CAST(raw_id AS INT) AS event_id,
    event_type,
    CAST(user_id AS INT) AS user_id,
    CAST(occurred_at AS TIMESTAMP) AS occurred_at
  FROM bronze_events
  WHERE user_id IS NOT NULL
),
gold_daily_kpis AS (
  SELECT
    CAST(occurred_at AS DATE) AS event_date,
    COUNT(*) AS event_count,
    COUNT(DISTINCT user_id) AS distinct_users
  FROM silver_events
  GROUP BY event_date
)
SELECT event_date::VARCHAR AS event_date, event_count, distinct_users
FROM gold_daily_kpis
ORDER BY event_date;`,
    grading_notes:
      "Reward: clear silver/gold separation, DISTINCT + type casts + null filter at silver, GROUP BY + aggregations at gold. Penalize: doing everything in one query (the medallion concept is about layering), forgetting the null filter (leaves event 4 in, day 2 becomes 4 events / 4 users), using COUNT(*) for distinct_users (loses the deduplication intent).",
    hints: [
      "Silver: SELECT DISTINCT with CAST + a WHERE filter for NULL user_id.",
      "Gold: GROUP BY CAST(occurred_at AS DATE), count rows and distinct users.",
      "Day 2 should have 3 events, not 4 (event 4 is dropped because user_id is NULL).",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P3 — ETL vs ELT
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "etl-vs-elt",
    prompt:
      "Raw events landed as JSON strings (the L of ELT — load first, untouched). Parse the JSON IN THE WAREHOUSE (the T of ELT — transform with SQL) and return event counts by type. Result columns: `event_type`, `event_count`, sorted alphabetically by event_type.",
    fixture_sql: `CREATE TABLE raw_events (
  json_payload VARCHAR
);
INSERT INTO raw_events VALUES
  ('{"event_id": 1, "user_id": 100, "type": "click"}'),
  ('{"event_id": 2, "user_id": 101, "type": "view"}'),
  ('{"event_id": 3, "user_id": 100, "type": "purchase"}'),
  ('{"event_id": 4, "user_id": 102, "type": "click"}'),
  ('{"event_id": 5, "user_id": 101, "type": "purchase"}'),
  ('{"event_id": 6, "user_id": 103, "type": "view"}'),
  ('{"event_id": 7, "user_id": 100, "type": "click"}');`,
    starter_sql: `-- Parse the JSON in SQL (the T of ELT) — don't pre-process anywhere else.
-- Use DuckDB's json_extract_string(payload, '$.field') function.

`,
    expected_result: [
      { event_type: "click", event_count: 3 },
      { event_type: "purchase", event_count: 2 },
      { event_type: "view", event_count: 2 },
    ],
    sample_solution: `SELECT
  json_extract_string(json_payload, '$.type') AS event_type,
  COUNT(*) AS event_count
FROM raw_events
GROUP BY event_type
ORDER BY event_type;`,
    grading_notes:
      "Reward: json_extract_string (or `payload->>'type'` if they know that syntax) to parse in SQL. Penalize: any suggestion of pre-parsing outside the warehouse (defeats ELT). Acceptable: using json_extract → cast — verbose but works.",
    hints: [
      "DuckDB: `json_extract_string(payload, '$.type')` extracts a string field from JSON.",
      "The ELT mindset: don't touch the data before it lands; transform it in SQL.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P4 — Backfilling
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "backfilling",
    prompt:
      "You're backfilling daily totals for the window 2026-06-01 through 2026-06-03. Write a query that returns one row per day in that range — using the DATE LITERALS in the WHERE clause, never `now()` or `CURRENT_DATE`. Result: `occurred_at` (VARCHAR), `daily_total`, sorted by occurred_at.",
    fixture_sql: `CREATE TABLE events (
  event_id INT,
  occurred_at DATE,
  amount DECIMAL(10,2)
);
INSERT INTO events VALUES
  (1, '2026-06-01', 10.00),
  (2, '2026-06-01', 20.00),
  (3, '2026-06-02', 15.00),
  (4, '2026-06-03', 25.00),
  (5, '2026-06-03', 5.00),
  (6, '2026-06-04', 50.00);   -- outside the backfill window`,
    starter_sql: `-- Backfill window: 2026-06-01 to 2026-06-03 (3 days).
-- DO NOT use now() or CURRENT_DATE — backfills are time-traveling, they need date literals.

`,
    expected_result: [
      { occurred_at: "2026-06-01", daily_total: 30 },
      { occurred_at: "2026-06-02", daily_total: 15 },
      { occurred_at: "2026-06-03", daily_total: 30 },
    ],
    sample_solution: `SELECT
  occurred_at::VARCHAR AS occurred_at,
  SUM(amount) AS daily_total
FROM events
WHERE occurred_at BETWEEN DATE '2026-06-01' AND DATE '2026-06-03'
GROUP BY occurred_at
ORDER BY occurred_at;`,
    grading_notes:
      "Reward: explicit date literals (DATE '2026-06-01') in WHERE, BETWEEN or pair of comparisons, GROUP BY the date column. Penalize HARD: using CURRENT_DATE, now(), or today() — backfills must NOT depend on when the job runs (that's the whole 'don't smear today's reality across history' point). Penalize: hardcoding three separate UNION ALL day-by-day queries (works but misses the range pattern).",
    hints: [
      "Use BETWEEN with DATE literals: `BETWEEN DATE '2026-06-01' AND DATE '2026-06-03'`.",
      "The exclusion of event 6 (2026-06-04) is part of the test — backfilling means time-windowed.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P4 — SLA for data
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "sla-for-data",
    prompt:
      "Given the freshness state of three data marts and an SLA of 60 minutes, return whether each is within SLA. Use `check_time = TIMESTAMP '2026-06-04 12:00:00'` as the reference time (hardcoded so the test is reproducible). Return: `mart_name`, `minutes_since_update` (INT), `within_sla` (BOOLEAN), sorted by mart_name.",
    fixture_sql: `CREATE TABLE mart_freshness (
  mart_name VARCHAR,
  last_updated TIMESTAMP
);
INSERT INTO mart_freshness VALUES
  ('orders_mart',    '2026-06-04 09:30:00'),  -- 150 min stale
  ('events_mart',    '2026-06-04 11:50:00'),  -- 10 min stale
  ('customers_mart', '2026-06-04 11:55:00');  -- 5 min stale`,
    starter_sql: `-- check_time = TIMESTAMP '2026-06-04 12:00:00'
-- sla_minutes = 60
-- For each mart: minutes_since_update = check_time - last_updated, in minutes
--                within_sla = minutes_since_update <= 60

`,
    expected_result: [
      { mart_name: "customers_mart", minutes_since_update: 5, within_sla: true },
      { mart_name: "events_mart", minutes_since_update: 10, within_sla: true },
      { mart_name: "orders_mart", minutes_since_update: 150, within_sla: false },
    ],
    sample_solution: `WITH config AS (
  SELECT TIMESTAMP '2026-06-04 12:00:00' AS check_time, 60 AS sla_minutes
)
SELECT
  m.mart_name,
  CAST(date_diff('minute', m.last_updated, c.check_time) AS INT) AS minutes_since_update,
  date_diff('minute', m.last_updated, c.check_time) <= c.sla_minutes AS within_sla
FROM mart_freshness m
CROSS JOIN config c
ORDER BY m.mart_name;`,
    grading_notes:
      "Reward: date_diff (or EXTRACT(EPOCH FROM ...)/60), explicit check_time literal, boolean expression for within_sla. Penalize HARD: using now() or CURRENT_TIMESTAMP — the SLA gate must be testable AT a specific moment (or against a stored watermark), not against wall-clock. Acceptable: hardcoding the check_time inside each calculation rather than a CTE.",
    hints: [
      "DuckDB: `date_diff('minute', earlier, later)` returns the difference in minutes.",
      "Use a CTE or inline literal for check_time; don't use now() — the test wants reproducible output.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P5 — Time and ordering (event time + watermarks)
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "time-and-ordering",
    prompt:
      "For each hourly window (by event time), return how many events arrived AFTER the window's watermark closed — those are the late events that arrived too late to be included if the system dropped them. Join `events` to `watermarks` (which tells you when each hour's window closed). Result: `hour_bucket` (VARCHAR), `event_count`, `late_count`. Sort by hour_bucket.",
    fixture_sql: `CREATE TABLE events (
  event_id INT,
  event_time TIMESTAMP,
  ingested_at TIMESTAMP
);
INSERT INTO events VALUES
  (1, '2026-06-04 09:15:00', '2026-06-04 09:20:00'),
  (2, '2026-06-04 09:45:00', '2026-06-04 09:50:00'),
  (3, '2026-06-04 09:55:00', '2026-06-04 10:30:00'),  -- ingested late
  (4, '2026-06-04 10:05:00', '2026-06-04 10:10:00'),
  (5, '2026-06-04 10:30:00', '2026-06-04 10:35:00'),
  (6, '2026-06-04 10:50:00', '2026-06-04 12:00:00'),  -- ingested very late
  (7, '2026-06-04 11:10:00', '2026-06-04 11:15:00');

CREATE TABLE watermarks (
  hour_bucket TIMESTAMP,
  closed_at TIMESTAMP   -- this hour's window closed 5 minutes after the hour ended
);
INSERT INTO watermarks VALUES
  ('2026-06-04 09:00:00', '2026-06-04 10:05:00'),
  ('2026-06-04 10:00:00', '2026-06-04 11:05:00'),
  ('2026-06-04 11:00:00', '2026-06-04 12:05:00');`,
    starter_sql: `-- An event is "late" if its ingested_at is AFTER its bucket's closed_at.
-- For the 09:00 bucket (closed at 10:05), event 3 is late (ingested 10:30).
-- For the 10:00 bucket (closed at 11:05), event 6 is late (ingested 12:00).

`,
    expected_result: [
      { hour_bucket: "2026-06-04 09:00:00", event_count: 3, late_count: 1 },
      { hour_bucket: "2026-06-04 10:00:00", event_count: 3, late_count: 1 },
      { hour_bucket: "2026-06-04 11:00:00", event_count: 1, late_count: 0 },
    ],
    sample_solution: `SELECT
  date_trunc('hour', e.event_time)::VARCHAR AS hour_bucket,
  COUNT(*) AS event_count,
  COUNT(*) FILTER (WHERE e.ingested_at > w.closed_at) AS late_count
FROM events e
JOIN watermarks w
  ON date_trunc('hour', e.event_time) = w.hour_bucket
GROUP BY date_trunc('hour', e.event_time)
ORDER BY hour_bucket;`,
    grading_notes:
      "Reward: COUNT(*) FILTER (WHERE ingested_at > closed_at) — the FILTER clause is the idiom for conditional aggregation. JOIN on date_trunc(event_time) = hour_bucket is the right way to bring the watermark into scope. Penalize: using ingested_at to bucket (the whole point is event-time bucketing); ignoring the watermark and just counting (loses the late_count); CASE WHEN inside SUM — works but FILTER is the idiomatic DuckDB pattern.",
    hints: [
      "COUNT(*) FILTER (WHERE condition) is DuckDB's conditional aggregate.",
      "JOIN events to watermarks on date_trunc('hour', event_time) = hour_bucket to bring the closing time into scope.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P5 — Delivery semantics
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "delivery-semantics",
    prompt:
      "`stream_events` is delivered at-least-once — some events appear twice as retries. Each event carries a unique `event_uuid` (the idempotency key). Compute total amount per user, deduplicating by `event_uuid` first so duplicates don't double-count. This is the canonical *at-least-once + idempotency = effectively-once* pattern.",
    fixture_sql: `CREATE TABLE stream_events (
  event_uuid VARCHAR,
  user_id INT,
  amount DECIMAL(10,2),
  delivered_at TIMESTAMP
);
INSERT INTO stream_events VALUES
  ('a1', 100, 50.00, '2026-06-04 09:00:00'),
  ('a2', 101, 30.00, '2026-06-04 09:05:00'),
  ('a1', 100, 50.00, '2026-06-04 09:10:00'),  -- duplicate of a1
  ('a3', 102, 75.00, '2026-06-04 09:15:00'),
  ('a2', 101, 30.00, '2026-06-04 09:20:00'),  -- duplicate of a2
  ('a4', 100, 25.00, '2026-06-04 09:25:00');`,
    starter_sql: `-- Without dedup, user 100 would total 125 (50+50+25) — double-counting!
-- Correct: dedup by event_uuid, then SUM.

`,
    expected_result: [
      { user_id: 100, total_amount: 75 },
      { user_id: 101, total_amount: 30 },
      { user_id: 102, total_amount: 75 },
    ],
    sample_solution: `WITH unique_events AS (
  SELECT DISTINCT event_uuid, user_id, amount
  FROM stream_events
)
SELECT user_id, SUM(amount) AS total_amount
FROM unique_events
GROUP BY user_id
ORDER BY user_id;`,
    grading_notes:
      "Reward: deduplication by event_uuid (the idempotency key) before aggregation — DISTINCT or ROW_NUMBER both work. Penalize HARD: aggregating without dedup (returns user 100 = 125, user 101 = 60 — the at-least-once double-counting failure mode). Penalize: deduplicating by (user_id, amount) — coincidentally works here but breaks if the same user makes two genuinely separate $50 purchases.",
    hints: [
      "SELECT DISTINCT event_uuid, user_id, amount FROM stream_events as a CTE.",
      "DISTINCT on event_uuid alone won't work — you need the other columns too.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P6 — Cost as performance
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "cost-as-performance",
    prompt:
      "`events_wide` has many columns. You want total amount for US events in June 2026. Write a query that touches as little data as possible: filter on the date partition column FIRST, and project ONLY the columns you actually need. Return one row with column `total_amount`.",
    fixture_sql: `CREATE TABLE events_wide (
  event_id INT,
  occurred_at DATE,
  user_id INT,
  region TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  amount DECIMAL(10,2),
  notes TEXT
);
INSERT INTO events_wide VALUES
  (1, '2026-05-31', 100, 'US', 'mobile',  'Chrome',  'Android', 30.00, 'pre-window'),
  (2, '2026-06-01', 100, 'US', 'mobile',  'Chrome',  'Android', 50.00, 'a'),
  (3, '2026-06-01', 101, 'UK', 'desktop', 'Firefox', 'Linux',   40.00, 'b'),
  (4, '2026-06-02', 100, 'US', 'mobile',  'Safari',  'iOS',     25.00, 'c'),
  (5, '2026-06-02', 102, 'US', 'desktop', 'Chrome',  'Mac',    100.00, 'd'),
  (6, '2026-06-03', 103, 'UK', 'mobile',  'Chrome',  'Android', 15.00, 'e'),
  (7, '2026-06-03', 101, 'US', 'desktop', 'Edge',    'Windows', 75.00, 'f'),
  (8, '2026-06-04', 100, 'US', 'mobile',  'Chrome',  'iOS',     60.00, 'g'),
  (9, '2026-07-01', 100, 'US', 'mobile',  'Chrome',  'iOS',     80.00, 'post-window');`,
    starter_sql: `-- Read as few bytes as possible:
--   * Project only the columns you need (NOT SELECT *).
--   * Filter on occurred_at (the date partition column) and region.

`,
    expected_result: [{ total_amount: 310 }],
    sample_solution: `SELECT SUM(amount) AS total_amount
FROM events_wide
WHERE occurred_at BETWEEN DATE '2026-06-01' AND DATE '2026-06-30'
  AND region = 'US';`,
    grading_notes:
      "Reward: minimal projection (SELECT just the aggregate), date range filter on occurred_at (the partition key) ordered first in WHERE, region filter. Penalize: SELECT * (defeats projection pushdown — would carry all 9 columns through the query plan), no date filter (the 'June 2026' framing requires bounding the date range), filtering on region but not date (pulls in pre-window and post-window rows). The point isn't just to get 310 — it's to do so cost-consciously.",
    hints: [
      "SELECT SUM(amount) — nothing else.",
      "WHERE clause: occurred_at range FIRST (that's the partition column), then region.",
      "The two out-of-window rows (event 1 in May, event 9 in July) must be excluded.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P7 — Data contracts
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "data-contracts",
    prompt:
      "Enforce the `orders` contract with SQL assertions. Contract clauses: `order_id` unique; `customer_id` NOT NULL; `amount` > 0; `status` IN ('pending', 'shipped', 'cancelled', 'refunded'). Return one row per violated assertion with `assertion_name` and `failed_count`, sorted alphabetically by assertion_name.",
    fixture_sql: `CREATE TABLE orders (
  order_id INT,
  customer_id INT,
  amount DECIMAL(10,2),
  status TEXT
);
INSERT INTO orders VALUES
  (1, 100, 50.00,  'pending'),
  (2, 101, 30.00,  'shipped'),
  (3, NULL, 100.00,'pending'),     -- customer_id null
  (4, 102, -5.00,  'shipped'),     -- negative amount
  (5, 103, 25.00,  'cancelled'),
  (5, 104, 75.00,  'pending'),     -- duplicate order_id (both 5s)
  (6, 105, 40.00,  'unknown');     -- invalid status`,
    starter_sql: `-- Assertion names (use these exact labels):
--   'amount_positive'
--   'customer_id_not_null'
--   'order_id_unique'
--   'status_valid'
-- UNION ALL the four checks; sort by assertion_name.

`,
    expected_result: [
      { assertion_name: "amount_positive", failed_count: 1 },
      { assertion_name: "customer_id_not_null", failed_count: 1 },
      { assertion_name: "order_id_unique", failed_count: 2 },
      { assertion_name: "status_valid", failed_count: 1 },
    ],
    sample_solution: `SELECT 'order_id_unique' AS assertion_name, COUNT(*) AS failed_count
FROM orders
WHERE order_id IN (SELECT order_id FROM orders GROUP BY order_id HAVING COUNT(*) > 1)
UNION ALL
SELECT 'customer_id_not_null', COUNT(*) FROM orders WHERE customer_id IS NULL
UNION ALL
SELECT 'amount_positive', COUNT(*) FROM orders WHERE amount <= 0
UNION ALL
SELECT 'status_valid', COUNT(*) FROM orders
WHERE status NOT IN ('pending', 'shipped', 'cancelled', 'refunded')
ORDER BY assertion_name;`,
    grading_notes:
      "Reward: UNION ALL of four named assertions, each with the labeled assertion_name and a COUNT(*) of rows that violate. Penalize: missing one of the four assertions, wrong assertion_name labels (the test compares strings), counting distinct violating keys for the uniqueness check (returns 1 instead of 2 — the prompt says how many rows are involved), forgetting the alphabetical sort.",
    hints: [
      "Four SELECTs, one per assertion, UNION ALL'd together.",
      "For uniqueness: GROUP BY order_id HAVING COUNT(*) > 1 finds the duplicate keys; then count the rows involved (2, not 1).",
      "Use the exact assertion_name strings from the prompt.",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P7 — Governance (row-level + column-level)
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "governance",
    prompt:
      "You're a US-region analyst. Return only US orders (row-level filter), and mask each customer's email so only the domain is visible (`alice@example.com` → `***@example.com`). Result: `order_id`, `region`, `customer_email` (masked), `amount`, sorted by order_id.",
    fixture_sql: `CREATE TABLE orders (
  order_id INT,
  region TEXT,
  customer_email TEXT,
  amount DECIMAL(10,2)
);
INSERT INTO orders VALUES
  (1, 'US', 'alice@example.com',        50.00),
  (2, 'UK', 'bob@example.co.uk',        30.00),
  (3, 'US', 'carol@example.com',       100.00),
  (4, 'DE', 'dave@example.de',          75.00),
  (5, 'US', 'eve@anotherdomain.com',    25.00);`,
    starter_sql: `-- Row-level: WHERE region = 'US'
-- Column-level: replace everything before '@' with '***' so only the domain is visible.

`,
    expected_result: [
      { order_id: 1, region: "US", customer_email: "***@example.com", amount: 50 },
      { order_id: 3, region: "US", customer_email: "***@example.com", amount: 100 },
      { order_id: 5, region: "US", customer_email: "***@anotherdomain.com", amount: 25 },
    ],
    sample_solution: `SELECT
  order_id,
  region,
  '***' || SUBSTRING(customer_email FROM POSITION('@' IN customer_email)) AS customer_email,
  amount
FROM orders
WHERE region = 'US'
ORDER BY order_id;`,
    grading_notes:
      "Reward: both filters present — WHERE region='US' (row-level) AND the masking expression (column-level). Penalize: returning the raw email (PII leak — the WHOLE point), masking but losing the domain (over-redaction; the policy keeps the domain visible for routing), no row filter (would expose UK/DE rows).",
    hints: [
      "Use POSITION('@' IN customer_email) to find where the domain starts.",
      "SUBSTRING(s FROM N) takes from position N onward — concatenate '***' with that.",
      "Both filters are required: row-level (WHERE) + column-level (masking expression).",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P7 — Breaking changes (schema drift detection)
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "breaking-changes",
    prompt:
      "Detect schema drift between `schema_v1` and `schema_v2`. Return one row per change with `change_type` (one of: `added`, `removed`, `type_changed`) and `column_name`. Sort by change_type, then column_name.",
    fixture_sql: `CREATE TABLE schema_v1 (
  column_name TEXT,
  data_type TEXT
);
INSERT INTO schema_v1 VALUES
  ('order_id',     'INT'),
  ('customer_id',  'INT'),
  ('amount',       'DECIMAL'),
  ('status',       'TEXT'),
  ('legacy_field', 'INT');

CREATE TABLE schema_v2 (
  column_name TEXT,
  data_type TEXT
);
INSERT INTO schema_v2 VALUES
  ('order_id',     'BIGINT'),     -- type changed
  ('customer_id',  'INT'),
  ('amount',       'DECIMAL'),
  ('status',       'VARCHAR'),    -- type changed
  ('created_at',   'TIMESTAMP'),  -- added
  ('updated_at',   'TIMESTAMP');  -- added
  -- legacy_field removed`,
    starter_sql: `-- Three categories: added (in v2 only), removed (in v1 only), type_changed (in both, different type).
-- UNION ALL them, sort by change_type then column_name.

`,
    expected_result: [
      { change_type: "added", column_name: "created_at" },
      { change_type: "added", column_name: "updated_at" },
      { change_type: "removed", column_name: "legacy_field" },
      { change_type: "type_changed", column_name: "order_id" },
      { change_type: "type_changed", column_name: "status" },
    ],
    sample_solution: `WITH added AS (
  SELECT 'added' AS change_type, column_name
  FROM schema_v2
  WHERE column_name NOT IN (SELECT column_name FROM schema_v1)
),
removed AS (
  SELECT 'removed' AS change_type, column_name
  FROM schema_v1
  WHERE column_name NOT IN (SELECT column_name FROM schema_v2)
),
type_changed AS (
  SELECT 'type_changed' AS change_type, v1.column_name
  FROM schema_v1 v1
  JOIN schema_v2 v2 ON v1.column_name = v2.column_name
  WHERE v1.data_type <> v2.data_type
)
SELECT * FROM added
UNION ALL SELECT * FROM removed
UNION ALL SELECT * FROM type_changed
ORDER BY change_type, column_name;`,
    grading_notes:
      "Reward: three clearly named categories, JOIN for type-changed, NOT IN / EXCEPT / anti-join for added and removed. Penalize: missing one of the three categories (most common: forgetting type_changed because they assume added/removed covers everything), using FULL OUTER JOIN that conflates added+removed+changed into a single confusing result.",
    hints: [
      "Three SELECTs (added, removed, type_changed) UNION ALL'd together.",
      "added = in v2 NOT IN v1; removed = in v1 NOT IN v2; type_changed = same name, different type (JOIN).",
    ],
  },

  // ─────────────────────────────────────────────────────
  // P5 — Windowing (tumbling)
  // ─────────────────────────────────────────────────────
  {
    concept_slug: "windowing",
    prompt:
      "Compute the count of events in each 5-minute tumbling window from `events`. Return `window_start` (as VARCHAR) and `event_count`. Order by window_start.",
    fixture_sql: `CREATE TABLE events (
  event_id INT,
  occurred_at TIMESTAMP
);
INSERT INTO events VALUES
  (1,  '2026-06-04 09:00:30'),
  (2,  '2026-06-04 09:02:15'),
  (3,  '2026-06-04 09:04:50'),
  (4,  '2026-06-04 09:05:10'),
  (5,  '2026-06-04 09:07:30'),
  (6,  '2026-06-04 09:08:45'),
  (7,  '2026-06-04 09:11:00'),
  (8,  '2026-06-04 09:13:30'),
  (9,  '2026-06-04 09:14:55'),
  (10, '2026-06-04 09:18:00');`,
    starter_sql: `-- Group events into non-overlapping 5-minute windows by occurred_at.
-- Return window_start (as VARCHAR) and event_count, ordered by window_start.

`,
    expected_result: [
      { window_start: "2026-06-04 09:00:00", event_count: 3 },
      { window_start: "2026-06-04 09:05:00", event_count: 3 },
      { window_start: "2026-06-04 09:10:00", event_count: 3 },
      { window_start: "2026-06-04 09:15:00", event_count: 1 },
    ],
    sample_solution: `SELECT
  time_bucket(INTERVAL '5 minutes', occurred_at)::VARCHAR AS window_start,
  COUNT(*) AS event_count
FROM events
GROUP BY time_bucket(INTERVAL '5 minutes', occurred_at)
ORDER BY window_start;`,
    grading_notes:
      "Reward: time_bucket() with a 5-minute interval, or equivalent (date_trunc with arithmetic). Penalize: using GROUP BY HOUR() (loses 5-minute granularity), using processing time (no such column here, but a wrong CASE-WHEN-based bucketing would qualify), forgetting the cast and getting timestamp-type-comparison failures. Sliding window approaches are NOT the right pattern — call this out as a 'gap'.",
    hints: [
      "DuckDB's `time_bucket(INTERVAL '5 minutes', timestamp_column)` rounds down to the nearest 5-minute boundary.",
      "Group by the bucket; cast it to VARCHAR for the result.",
    ],
  },
];
