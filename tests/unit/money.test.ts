import { describe, expect, it } from "vitest";

import {
  formatCad,
  formatPercent,
  formatSignedCad,
  parseCadToCents,
  roundHalfAwayFromZero,
} from "../../src/domain/money.js";

describe("CAD parsing", () => {
  it.each(["$1,234.56", "1234.56", "1,234.56"])(
    "parses %s into integer cents",
    (input) => {
      expect(parseCadToCents(input)).toEqual({ ok: true, value: 123_456 });
    },
  );

  it.each([
    ["", "empty"],
    ["-1", "negative"],
    ["1.001", "too-precise"],
    ["1e3", "invalid-format"],
    ["NaN", "invalid-format"],
    ["Infinity", "invalid-format"],
    ["12,34.00", "invalid-format"],
  ])("rejects %s", (input, code) => {
    const result = parseCadToCents(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(code);
  });

  it("accepts the exact monthly boundaries", () => {
    expect(parseCadToCents("0.00")).toEqual({ ok: true, value: 0 });
    expect(parseCadToCents("$1,000,000.00")).toEqual({
      ok: true,
      value: 100_000_000,
    });
  });

  it("rejects one cent over the maximum", () => {
    const result = parseCadToCents("1,000,000.01");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("too-large");
  });
});

describe("money and ratio display", () => {
  it("formats CAD with two decimals and a typographic minus", () => {
    expect(formatCad(123_456)).toBe("$1,234.56");
    expect(formatCad(-14_500)).toBe("−$145.00");
    expect(formatSignedCad(20_000)).toBe("+$200.00");
    expect(formatCad(-0)).toBe("$0.00");
    expect(formatSignedCad(-0)).toBe("$0.00");
  });

  it("formats ratios to one decimal and null as N/A", () => {
    expect(formatPercent(0.515151)).toBe("51.5%");
    expect(formatPercent(null)).toBe("N/A");
  });

  it("rounds fractional cents half away from zero", () => {
    expect(roundHalfAwayFromZero(0.5)).toBe(1);
    expect(roundHalfAwayFromZero(-0.5)).toBe(-1);
    expect(roundHalfAwayFromZero(1.49)).toBe(1);
    expect(roundHalfAwayFromZero(-1.49)).toBe(-1);
  });
});
