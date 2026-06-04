// Compare a query result against an expected result, both expressed as
// arrays of row-objects. We treat row ORDER as significant unless the
// expected is explicitly a Set (we don't have that distinction here, so
// we always compare ordered). Column ORDER doesn't matter — we compare
// by key. Cell values are compared loosely (string-vs-number coercion
// to be forgiving of duckdb's column-type quirks).

export type Row = Record<string, unknown>;

export type CompareResult = {
  match: boolean;
  reason?: string;
};

export function compareResults(
  actual: Row[],
  expected: Row[],
): CompareResult {
  if (actual.length !== expected.length) {
    return {
      match: false,
      reason: `Row count mismatch — got ${actual.length}, expected ${expected.length}.`,
    };
  }
  if (expected.length === 0) return { match: true };

  // Verify expected columns exist in actual.
  const expectedCols = new Set(Object.keys(expected[0]));
  const actualCols = new Set(Object.keys(actual[0] ?? {}));
  for (const col of expectedCols) {
    if (!actualCols.has(col)) {
      return {
        match: false,
        reason: `Missing column "${col}" in your result.`,
      };
    }
  }

  for (let i = 0; i < expected.length; i++) {
    const e = expected[i];
    const a = actual[i];
    for (const col of expectedCols) {
      if (!loose(a[col], e[col])) {
        return {
          match: false,
          reason: `Row ${i + 1}, column "${col}": got ${stringify(a[col])}, expected ${stringify(e[col])}.`,
        };
      }
    }
  }
  return { match: true };
}

function loose(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined) return b === null || b === undefined;
  if (b === null || b === undefined) return false;
  // Number-string coercion (DuckDB sometimes returns numbers as strings via
  // certain casts; expected is JSON which serializes BigInt as string).
  if (typeof a === "number" && typeof b === "string") {
    return String(a) === b;
  }
  if (typeof a === "string" && typeof b === "number") {
    return a === String(b);
  }
  // Date-ISO compare
  if (typeof a === "string" && typeof b === "string") {
    return a === b;
  }
  // Booleans
  if (typeof a === "boolean" && typeof b === "boolean") return a === b;
  return false;
}

function stringify(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "string") return `"${v}"`;
  return String(v);
}
