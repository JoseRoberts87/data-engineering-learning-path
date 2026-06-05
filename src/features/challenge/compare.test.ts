import { describe, expect, test } from "bun:test";
import { compareResults, type Row } from "./compare";

describe("compareResults", () => {
  describe("matching", () => {
    test("two empty arrays match", () => {
      expect(compareResults([], [])).toEqual({ match: true });
    });

    test("identical single-row results match", () => {
      const rows: Row[] = [{ id: 1, name: "Alice" }];
      expect(compareResults(rows, rows)).toEqual({ match: true });
    });

    test("identical multi-row results in same order match", () => {
      const rows: Row[] = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 },
      ];
      expect(compareResults(rows, rows)).toEqual({ match: true });
    });
  });

  describe("row count mismatch", () => {
    test("actual has more rows", () => {
      const result = compareResults(
        [{ a: 1 }, { a: 2 }, { a: 3 }],
        [{ a: 1 }, { a: 2 }],
      );
      expect(result.match).toBe(false);
      expect(result.reason).toContain("got 3");
      expect(result.reason).toContain("expected 2");
    });

    test("actual has fewer rows", () => {
      const result = compareResults([{ a: 1 }], [{ a: 1 }, { a: 2 }]);
      expect(result.match).toBe(false);
      expect(result.reason).toContain("got 1");
      expect(result.reason).toContain("expected 2");
    });

    test("actual empty when expected has rows", () => {
      const result = compareResults([], [{ a: 1 }]);
      expect(result.match).toBe(false);
      expect(result.reason).toContain("got 0");
      expect(result.reason).toContain("expected 1");
    });
  });

  describe("column shape mismatch", () => {
    test("actual missing an expected column", () => {
      const result = compareResults(
        [{ id: 1 }],
        [{ id: 1, name: "Alice" }],
      );
      expect(result.match).toBe(false);
      expect(result.reason).toContain("name");
    });

    test("actual has extra columns (allowed)", () => {
      // Extra columns are NOT a failure — only expected columns are checked.
      // This means the user's `SELECT *` is fine as long as the expected
      // columns match.
      const result = compareResults(
        [{ id: 1, name: "Alice", extra: "ignored" }],
        [{ id: 1, name: "Alice" }],
      );
      expect(result.match).toBe(true);
    });
  });

  describe("cell value mismatch", () => {
    test("string value differs", () => {
      const result = compareResults(
        [{ name: "Alice" }],
        [{ name: "Alicia" }],
      );
      expect(result.match).toBe(false);
      expect(result.reason).toContain("name");
      expect(result.reason).toContain("Row 1");
    });

    test("number value differs", () => {
      const result = compareResults([{ amount: 50 }], [{ amount: 45 }]);
      expect(result.match).toBe(false);
      expect(result.reason).toContain("amount");
    });

    test("mismatch at a later row reports the right row index", () => {
      const result = compareResults(
        [{ id: 1 }, { id: 2 }, { id: 99 }],
        [{ id: 1 }, { id: 2 }, { id: 3 }],
      );
      expect(result.match).toBe(false);
      expect(result.reason).toContain("Row 3");
    });
  });

  describe("loose number/string coercion (DuckDB <-> JSON quirks)", () => {
    test("number actual matches string expected with same value", () => {
      // DuckDB returns DECIMALs as JS numbers, but JSON may have stringified
      // them. The compare layer accepts either.
      const result = compareResults([{ amount: 50 }], [{ amount: "50" }]);
      expect(result.match).toBe(true);
    });

    test("string actual matches number expected with same value", () => {
      const result = compareResults([{ amount: "50" }], [{ amount: 50 }]);
      expect(result.match).toBe(true);
    });

    test("different numeric values still mismatch (loose ≠ blind)", () => {
      const result = compareResults([{ amount: 50 }], [{ amount: "51" }]);
      expect(result.match).toBe(false);
    });
  });

  describe("null / undefined handling", () => {
    test("null === null matches", () => {
      const result = compareResults(
        [{ value: null }],
        [{ value: null }],
      );
      expect(result.match).toBe(true);
    });

    test("undefined treated as null on either side", () => {
      const result = compareResults(
        [{ value: undefined }],
        [{ value: null }],
      );
      expect(result.match).toBe(true);
    });

    test("null vs value mismatches", () => {
      const result = compareResults([{ value: null }], [{ value: 42 }]);
      expect(result.match).toBe(false);
    });

    test("value vs null mismatches", () => {
      const result = compareResults([{ value: 42 }], [{ value: null }]);
      expect(result.match).toBe(false);
    });
  });

  describe("boolean comparison", () => {
    test("true === true matches", () => {
      expect(
        compareResults([{ ok: true }], [{ ok: true }]).match,
      ).toBe(true);
    });
    test("false === false matches", () => {
      expect(
        compareResults([{ ok: false }], [{ ok: false }]).match,
      ).toBe(true);
    });
    test("true vs false mismatches", () => {
      expect(
        compareResults([{ ok: true }], [{ ok: false }]).match,
      ).toBe(false);
    });
  });

  describe("order matters", () => {
    test("same rows in different order is a mismatch", () => {
      const result = compareResults(
        [
          { id: 2, name: "Bob" },
          { id: 1, name: "Alice" },
        ],
        [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
      );
      expect(result.match).toBe(false);
    });
  });
});
