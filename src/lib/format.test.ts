import { describe, expect, test } from "bun:test";
import { formatMinutes } from "./format";

describe("formatMinutes", () => {
  describe("absent / non-positive values render as em-dash", () => {
    test("null", () => {
      expect(formatMinutes(null)).toBe("—");
    });
    test("undefined", () => {
      expect(formatMinutes(undefined)).toBe("—");
    });
    test("zero", () => {
      expect(formatMinutes(0)).toBe("—");
    });
    test("negative", () => {
      expect(formatMinutes(-5)).toBe("—");
    });
  });

  describe("under an hour: ~N min", () => {
    test("1 minute", () => {
      expect(formatMinutes(1)).toBe("~1 min");
    });
    test("typical concept estimate (15)", () => {
      expect(formatMinutes(15)).toBe("~15 min");
    });
    test("just under the hour boundary (59)", () => {
      expect(formatMinutes(59)).toBe("~59 min");
    });
  });

  describe("whole hours: ~Nh (no minute suffix)", () => {
    test("exactly one hour", () => {
      expect(formatMinutes(60)).toBe("~1h");
    });
    test("two hours", () => {
      expect(formatMinutes(120)).toBe("~2h");
    });
    test("five hours", () => {
      expect(formatMinutes(300)).toBe("~5h");
    });
  });

  describe("hours with a remainder: ~Nh Mm", () => {
    test("1h 15m", () => {
      expect(formatMinutes(75)).toBe("~1h 15m");
    });
    test("1h 35m (phase 4 total)", () => {
      expect(formatMinutes(95)).toBe("~1h 35m");
    });
    test("2h 5m", () => {
      expect(formatMinutes(125)).toBe("~2h 5m");
    });
    test("phase 2 total (158 -> 2h 38m)", () => {
      expect(formatMinutes(158)).toBe("~2h 38m");
    });
    test("whole curriculum (~14h 21m)", () => {
      expect(formatMinutes(861)).toBe("~14h 21m");
    });
  });
});
