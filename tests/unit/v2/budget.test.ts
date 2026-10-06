import { describe, expect, it } from "vitest";
import {
  analyzeBudget,
  modelPurchase,
  suggestEmergencyStarter,
  suggestPaychequeSplit,
} from "../../../src/v2/domain/budget";
import { asV2Cents, parseV2CadInput } from "../../../src/v2/domain/money";

describe("V2 budget analysis", () => {
  it("reconciles exact cents and calculates integer basis-point shares", () => {
    const result = analyzeBudget(
      asV2Cents(100_00),
      [
        { category: "groceries", amountCents: asV2Cents(33_33) },
        { category: "clothing", amountCents: asV2Cents(12_34) },
      ],
      { hasDebt: false },
    );
    expect(result.allocatedCents).toBe(45_67);
    expect(result.unallocatedCents).toBe(54_33);
    expect(result.allocations[0]?.shareOfAvailableBasisPoints).toBe(3333);
    expect(result.checks).toHaveLength(5);
  });

  it("preserves over-allocation and flags a missing debt amount", () => {
    const result = analyzeBudget(
      asV2Cents(100_00),
      [{ category: "groceries", amountCents: asV2Cents(120_00) }],
      { hasDebt: true },
    );
    expect(result.unallocatedCents).toBe(-20_00);
    expect(
      result.checks.find((check) => check.id === "affordability")?.status,
    ).toBe("attention");
    expect(
      result.checks.find((check) => check.id === "debt-visibility")?.status,
    ).toBe("attention");
  });

  it("models a purchase without mutating the plan", () => {
    const result = analyzeBudget(
      asV2Cents(1_000_00),
      [{ category: "clothing", amountCents: asV2Cents(100_00) }],
      { hasDebt: false },
    );
    const impact = modelPurchase(result, "clothing", asV2Cents(125_00));
    expect(impact.remainingAvailableCents).toBe(875_00);
    expect(impact.categoryRemainingCents).toBe(-25_00);
    expect(impact.exceedsCategoryPlan).toBe(true);
    expect(result.allocations[0]?.amountCents).toBe(100_00);
  });

  it("rejects duplicate categories and negative allocations", () => {
    expect(() =>
      analyzeBudget(
        asV2Cents(10),
        [
          { category: "groceries", amountCents: asV2Cents(1) },
          { category: "groceries", amountCents: asV2Cents(1) },
        ],
        { hasDebt: false },
      ),
    ).toThrow(/unique/);
    expect(() =>
      analyzeBudget(
        asV2Cents(10),
        [{ category: "clothing", amountCents: asV2Cents(-1) }],
        { hasDebt: false },
      ),
    ).toThrow(/non-negative/);
  });

  it("calculates the optional emergency starter in exact cents", () => {
    expect(suggestEmergencyStarter(asV2Cents(1_000_00))).toBe(50_00);
    expect(suggestEmergencyStarter(asV2Cents(1))).toBe(0);
    expect(suggestEmergencyStarter(asV2Cents(10), 1000 as never)).toBe(1);
  });

  it("scales the user's category pattern to an exact paycheque split", () => {
    const result = suggestPaychequeSplit(
      asV2Cents(1_000_00),
      [
        { category: "housing", amountCents: asV2Cents(500_00) },
        { category: "groceries", amountCents: asV2Cents(250_00) },
        { category: "savings-goals", amountCents: asV2Cents(250_00) },
      ],
      asV2Cents(100_00),
    );
    expect(result).toEqual([
      { category: "debt-payments", amountCents: 100_00 },
      { category: "housing", amountCents: 450_00 },
      { category: "groceries", amountCents: 225_00 },
      { category: "savings-goals", amountCents: 225_00 },
    ]);
    expect(result.reduce((sum, item) => sum + item.amountCents, 0)).toBe(
      1_000_00,
    );
  });

  it("uses deterministic cent remainders without floating-point loss", () => {
    const result = suggestPaychequeSplit(
      asV2Cents(100),
      [
        { category: "housing", amountCents: asV2Cents(1) },
        { category: "groceries", amountCents: asV2Cents(1) },
        { category: "clothing", amountCents: asV2Cents(1) },
      ],
      asV2Cents(0),
    );
    expect(result.map((item) => item.amountCents)).toEqual([34, 33, 33]);
  });
});

describe("V2 CAD input", () => {
  it("parses decimals exactly without floating point", () => {
    expect(parseV2CadInput("$1,234.56")).toEqual({ ok: true, cents: 123456 });
    expect(parseV2CadInput("0.01")).toEqual({ ok: true, cents: 1 });
  });

  it("rejects excess precision and negatives by default", () => {
    expect(parseV2CadInput("1.001").ok).toBe(false);
    expect(parseV2CadInput("-1").ok).toBe(false);
  });
});
