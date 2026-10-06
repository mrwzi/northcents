import { describe, expect, it } from "vitest";
import {
  addCents,
  allocateCents,
  asNonNegativeV2Cents,
  asV2Cents,
  MAX_V2_CENTS,
  subtractCents,
} from "../../../src/v2/domain/money";
import {
  aprDailyRate,
  asAprBasisPoints,
  MAX_APR_BASIS_POINTS,
  parseAprPercent,
} from "../../../src/v2/domain/percentage";
describe("V2 money", () => {
  it.each([0, 1, -1, MAX_V2_CENTS, -MAX_V2_CENTS])(
    "accepts %i safe cents",
    (value) => {
      expect(asV2Cents(value)).toBe(value);
    },
  );
  it("rejects unsafe, excessive, and negative amount values", () => {
    expect(() => asV2Cents(MAX_V2_CENTS + 1)).toThrow();
    expect(() => asV2Cents(Number.MAX_SAFE_INTEGER + 1)).toThrow();
    expect(() => asNonNegativeV2Cents(-1)).toThrow();
  });
  it("protects addition and subtraction bounds", () => {
    expect(addCents(asV2Cents(10), asV2Cents(5))).toBe(15);
    expect(subtractCents(asV2Cents(10), asV2Cents(15))).toBe(-5);
    expect(() => addCents(asV2Cents(MAX_V2_CENTS), asV2Cents(1))).toThrow();
  });
  it("allocates cents exactly and deterministically", () => {
    const result = allocateCents(asNonNegativeV2Cents(10), 3);
    expect(result).toEqual([4, 3, 3]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(10);
  });
});
describe("APR basis points", () => {
  it.each([
    ["0", 0],
    ["5.00", 500],
    ["20.99%", 2099],
  ])("parses %s", (text, expected) => {
    expect(parseAprPercent(text)).toBe(expected);
  });
  it("rejects fractions of a basis point, negatives, and upper overflow", () => {
    expect(() => parseAprPercent("5.001")).toThrow();
    expect(() => parseAprPercent("-1")).toThrow();
    expect(() => asAprBasisPoints(1.5)).toThrow();
    expect(() => asAprBasisPoints(MAX_APR_BASIS_POINTS + 1)).toThrow();
  });
  it("exposes exact bigint rational daily rate", () => {
    expect(aprDailyRate(asAprBasisPoints(2099))).toEqual({
      numerator: 2099n,
      denominator: 3_650_000n,
    });
  });
});
