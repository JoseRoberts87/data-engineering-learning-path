// Browser-side DuckDB-WASM singleton. Loads lazily on first use; cached
// across calls. Uses the official JSDelivr-served bundle (the standard
// pattern) — the WASM and worker files are ~3MB total, cached by the
// browser after first load.

import * as duckdb from "@duckdb/duckdb-wasm";

let _dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

export async function getDb(): Promise<duckdb.AsyncDuckDB> {
  if (_dbPromise) return _dbPromise;
  _dbPromise = (async () => {
    const allBundles = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(allBundles);
    const workerBlob = new Blob(
      [`importScripts("${bundle.mainWorker!}");`],
      { type: "application/javascript" },
    );
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    URL.revokeObjectURL(workerUrl);
    return db;
  })();
  return _dbPromise;
}

// Open a fresh connection, run the provided fixture SQL on it, return
// the connection. Caller is responsible for closing it.
export async function openConnectionWithFixture(
  fixtureSql: string,
): Promise<duckdb.AsyncDuckDBConnection> {
  const db = await getDb();
  const conn = await db.connect();
  if (fixtureSql.trim().length > 0) {
    await conn.query(fixtureSql);
  }
  return conn;
}

// Execute a user-provided SQL string against an open connection and
// return rows as JSON-friendly arrays of objects.
export async function executeUserSql(
  conn: duckdb.AsyncDuckDBConnection,
  sql: string,
): Promise<{ columns: string[]; rows: Array<Record<string, unknown>> }> {
  const result = await conn.query(sql);
  // Arrow Table -> rows
  const columns = result.schema.fields.map((f) => f.name);
  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < result.numRows; i++) {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      // Arrow values can be BigInts, Dates, etc.; coerce to JSON-safe shapes
      const v = result.getChild(col)?.get(i);
      row[col] = normalize(v);
    }
    rows.push(row);
  }
  return { columns, rows };
}

function normalize(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "bigint") return Number(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    // Arrow Vectors and structs come through as objects; best-effort to JSON-ify
    try {
      return JSON.parse(JSON.stringify(v));
    } catch {
      return String(v);
    }
  }
  return v;
}
