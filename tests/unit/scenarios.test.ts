import { describe, expect, it } from "vitest";

import { getDemoProfile } from "../../src/data/demo-profiles.js";
import {
  comparePositions,
  describeImpact,
} from "../../src/domain/comparison.js";
import { calculatePosition } from "../../src/domain/finance.js";
import { applyScenario } from "../../src/domain/scenarios.js";
import type { Baseline, Scenario } from "../../src/domain/types.js";

const renter = getDemoProfile("student-renter").baseline;

describe("housing scenarios", () => {
  it("reproduces the known $850 to $1,050 case", () => {
    const scenario: Scenario = {
      type: "housing",
      mode: "absolute",
      value: 105_000,
    };
    const changed = applyScenario(renter, scenario);
    const currentPosition = calculatePosition(renter);
    const scenarioPosition = calculatePosition(changed);
    const comparison = comparePositions(currentPosition, scenarioPosition);

    expect(changed.housingCents).toBe(105_000);
    expect(scenarioPosition.nonSavingsOutflowsCents).toBe(163_000);
    expect(scenarioPosition.coreSurplusCents).toBe(2_000);
    expect(scenarioPosition.remainingFlexibleCashCents).toBe(-13_000);
    expect(comparison.coreSurplus.delta).toBe(-20_000);
    expect(comparison.coreSurplus.annualDelta).toBe(-240_000);
    expect(comparison.remainingFlexibleCash.delta).toBe(-20_000);
    expect(comparison.remainingFlexibleCash.annualDelta).toBe(-240_000);
    expect(comparison.coreSurplusRelativeChange).toBeCloseTo(-0.90909, 5);
    expect(currentPosition.housingToIncomeRatio).toBeCloseTo(85 / 165, 12);
    expect(scenarioPosition.housingToIncomeRatio).toBeCloseTo(105 / 165, 12);
    expect(comparison.housingToIncomeRatio.delta).toBeCloseTo(20 / 165, 12);
  });

  it("supports a signed housing delta", () => {
    expect(
      applyScenario(renter, { type: "housing", mode: "delta", value: -5_000 })
        .housingCents,
    ).toBe(80_000);
  });

  it("rejects a resolved negative housing amount", () => {
    expect(() =>
      applyScenario(renter, { type: "housing", mode: "delta", value: -90_000 }),
    ).toThrow();
  });
});

describe("income scenarios", () => {
  it("supports an absolute income", () => {
    const changed = applyScenario(renter, {
      type: "income",
      mode: "absolute",
      value: 180_000,
    });
    expect(changed.incomeCents).toBe(180_000);
  });

  it("supports a percentage income adjustment", () => {
    const changed = applyScenario(renter, {
      type: "income",
      mode: "percent",
      value: -10,
    });
    expect(changed.incomeCents).toBe(148_500);
  });

  it("allows a -100% income scenario and produces null ratios", () => {
    const changed = applyScenario(renter, {
      type: "income",
      mode: "percent",
      value: -100,
    });
    expect(changed.incomeCents).toBe(0);
    expect(calculatePosition(changed).expenseToIncomeRatio).toBeNull();
  });

  it("rejects income percentages below -100%", () => {
    expect(() =>
      applyScenario(renter, {
        type: "income",
        mode: "percent",
        value: -100.01,
      }),
    ).toThrow();
  });

  it("rejects negative absolute income", () => {
    expect(() =>
      applyScenario(renter, { type: "income", mode: "absolute", value: -1 }),
    ).toThrow();
  });
});

describe("cost-of-living scenarios", () => {
  it("increases only eligible other expenses", () => {
    const changed = applyScenario(renter, {
      type: "cost-of-living",
      mode: "percent",
      value: 10,
    });

    expect(changed.otherExpensesCents).toBe(63_800);
    expect(changed.housingCents).toBe(renter.housingCents);
    expect(changed.debtPaymentsCents).toBe(renter.debtPaymentsCents);
    expect(changed.plannedSavingsCents).toBe(renter.plannedSavingsCents);
    expect(changed.incomeCents).toBe(renter.incomeCents);
  });

  it("rounds a fractional cent half away from zero at the scenario boundary", () => {
    const tinyBaseline: Baseline = {
      incomeCents: 100,
      housingCents: 0,
      otherExpensesCents: 1,
      debtPaymentsCents: 0,
      plannedSavingsCents: 0,
    };
    const changed = applyScenario(tinyBaseline, {
      type: "cost-of-living",
      mode: "percent",
      value: 50,
    });
    expect(changed.otherExpensesCents).toBe(2);
  });
});

describe("planned-savings scenarios", () => {
  it("changes flexible cash without changing core surplus", () => {
    const current = calculatePosition(renter);
    const changed = calculatePosition(
      applyScenario(renter, { type: "savings", mode: "delta", value: 5_000 }),
    );

    expect(changed.plannedSavingsCents).toBe(20_000);
    expect(changed.coreSurplusCents).toBe(current.coreSurplusCents);
    expect(changed.remainingFlexibleCashCents).toBe(
      current.remainingFlexibleCashCents - 5_000,
    );
  });

  it("permits savings above core surplus", () => {
    const changed = calculatePosition(
      applyScenario(renter, {
        type: "savings",
        mode: "absolute",
        value: 30_000,
      }),
    );
    expect(changed.remainingFlexibleCashCents).toBe(-8_000);
  });
});

describe("scenario engine invariants", () => {
  it("does not mutate the baseline", () => {
    const snapshot = structuredClone(renter);
    applyScenario(renter, { type: "housing", mode: "delta", value: 20_000 });
    expect(renter).toEqual(snapshot);
  });

  it("does not compound repeated edits when called with the immutable baseline", () => {
    const first = applyScenario(renter, {
      type: "housing",
      mode: "delta",
      value: 20_000,
    });
    const second = applyScenario(renter, {
      type: "housing",
      mode: "delta",
      value: 30_000,
    });
    expect(first.housingCents).toBe(105_000);
    expect(second.housingCents).toBe(115_000);
  });

  it("produces neutral, deterministic explanatory data", () => {
    const scenario: Scenario = {
      type: "housing",
      mode: "delta",
      value: 20_000,
    };
    const comparison = comparePositions(
      calculatePosition(renter),
      calculatePosition(applyScenario(renter, scenario)),
    );
    const explanation = describeImpact(comparison, scenario);

    expect(explanation).toEqual({
      metric: "remaining-flexible-cash",
      scenarioType: "housing",
      direction: "decrease",
      monthlyDifferenceCents: -20_000,
      annualDifferenceCents: -240_000,
      message:
        "Your remaining flexible cash decreases by $200.00 per month in this scenario.",
      isEstimate: true,
      isRecommendation: false,
    });
    expect(explanation.message).not.toMatch(/should|recommend|afford/i);
  });
});
