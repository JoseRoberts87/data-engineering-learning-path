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
