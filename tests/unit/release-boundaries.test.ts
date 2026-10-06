import { describe, expect, it } from "vitest";

import { comparePositions } from "../../src/domain/comparison";
import { calculatePosition } from "../../src/domain/finance";
import { formatCad, formatPercent } from "../../src/domain/money";
import { applyScenario } from "../../src/domain/scenarios";
import type { Baseline } from "../../src/domain/types";

function expectFinitePosition(baseline: Baseline) {
  const position = calculatePosition(baseline);
  for (const value of Object.values(position)) {
    if (typeof value === "number") {
      expect(Number.isFinite(value)).toBe(true);
      expect(Number.isSafeInteger(value) || !Number.isInteger(value)).toBe(
        true,
      );
    }
  }
  expect(JSON.stringify(position)).not.toMatch(/NaN|Infinity/);
  return position;
}

describe("release boundary matrix", () => {
  it.each([
    [
      "all zero",
      {
        incomeCents: 0,
        housingCents: 0,
        otherExpensesCents: 0,
        debtPaymentsCents: 0,
        plannedSavingsCents: 0,
      },
    ],
    [
      "one-cent values",
      {
        incomeCents: 1,
        housingCents: 1,
        otherExpensesCents: 1,
        debtPaymentsCents: 1,
        plannedSavingsCents: 1,
      },
    ],
    [
      "decimal dollar inputs",
      {
        incomeCents: 1_001,
        housingCents: 1,
        otherExpensesCents: 0,
        debtPaymentsCents: 0,
        plannedSavingsCents: 0,
      },
    ],
    [
      "maximum fields",
      {
        incomeCents: 100_000_000,
        housingCents: 100_000_000,
        otherExpensesCents: 100_000_000,
        debtPaymentsCents: 100_000_000,
        plannedSavingsCents: 100_000_000,
      },
    ],
  ] satisfies readonly [string, Baseline][])(
    "keeps %s finite and cent-safe",
    (_name, baseline) => {
      const position = expectFinitePosition(baseline);
      expect(formatCad(position.coreSurplusCents)).not.toMatch(
        /NaN|Infinity|−\$0\.00/,
      );
    },
  );

  it("preserves exact zero, deficit, and savings-above-surplus states", () => {
    const exactZeroCore = calculatePosition({
      incomeCents: 10_001,
      housingCents: 5_000,
      otherExpensesCents: 4_000,
      debtPaymentsCents: 1_001,
      plannedSavingsCents: 0,
    });
    expect(exactZeroCore.coreSurplusCents).toBe(0);
    expect(exactZeroCore.remainingFlexibleCashCents).toBe(0);

    const exactZeroFlexible = calculatePosition({
      incomeCents: 10_001,
      housingCents: 5_000,
      otherExpensesCents: 3_000,
      debtPaymentsCents: 1_000,
      plannedSavingsCents: 1_001,
    });
    expect(exactZeroFlexible.coreSurplusCents).toBe(1_001);
    expect(exactZeroFlexible.remainingFlexibleCashCents).toBe(0);

    const deficit = calculatePosition({
      incomeCents: 1,
      housingCents: 2,
      otherExpensesCents: 3,
      debtPaymentsCents: 4,
      plannedSavingsCents: 5,
    });
    expect(deficit.coreSurplusCents).toBe(-8);
    expect(deficit.remainingFlexibleCashCents).toBe(-13);
  });

  it("rounds half-cent percentage results once and supports decreases toward zero", () => {
    const tiny: Baseline = {
      incomeCents: 1,
      housingCents: 0,
      otherExpensesCents: 1,
      debtPaymentsCents: 0,
      plannedSavingsCents: 0,
    };
    expect(
      applyScenario(tiny, { type: "income", mode: "percent", value: 50 })
        .incomeCents,
    ).toBe(2);
    expect(
      applyScenario(tiny, {
        type: "cost-of-living",
        mode: "percent",
        value: -50,
      }).otherExpensesCents,
    ).toBe(1);
    const nearZero = applyScenario(
      { ...tiny, incomeCents: 100 },
      { type: "income", mode: "percent", value: -99 },
    );
    expect(nearZero.incomeCents).toBe(1);
    expect(
      applyScenario(tiny, {
        type: "cost-of-living",
        mode: "percent",
        value: -100,
      }).otherExpensesCents,
    ).toBe(0);
  });

  it("keeps annualization, signs, ratio nulls, and percentage points exact", () => {
    const baseline: Baseline = {
      incomeCents: 100,
      housingCents: 25,
      otherExpensesCents: 25,
      debtPaymentsCents: 0,
      plannedSavingsCents: 50,
    };
    const current = calculatePosition(baseline);
    const scenario = calculatePosition(
      applyScenario(baseline, { type: "housing", mode: "delta", value: -1 }),
    );
    const comparison = comparePositions(current, scenario);
    expect(comparison.coreSurplus.delta).toBe(1);
    expect(comparison.coreSurplus.annualDelta).toBe(12);
    expect(comparison.housingToIncomeRatio.delta).toBeCloseTo(-0.01, 12);

    const zeroIncome = calculatePosition({
      incomeCents: 0,
      housingCents: 1,
      otherExpensesCents: 0,
      debtPaymentsCents: 0,
      plannedSavingsCents: 0,
    });
    expect(formatPercent(zeroIncome.housingToIncomeRatio)).toBe("N/A");
  });
});
