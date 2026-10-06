import { describe, expect, it } from "vitest";

import { getDemoProfile } from "../../src/data/demo-profiles.js";
import { calculatePosition } from "../../src/domain/finance.js";

describe("financial position calculations", () => {
  it("reproduces the student renter baseline", () => {
    const position = calculatePosition(
      getDemoProfile("student-renter").baseline,
    );

    expect(position.nonSavingsOutflowsCents).toBe(143_000);
    expect(position.coreSurplusCents).toBe(22_000);
    expect(position.remainingFlexibleCashCents).toBe(7_000);
    expect(position.housingToIncomeRatio).toBeCloseTo(85 / 165, 12);
    expect(position.savingsRate).toBeCloseTo(15 / 165, 12);
    expect(position.expenseToIncomeRatio).toBeCloseTo(143 / 165, 12);
  });

  it("returns null for every income-based ratio when income is zero", () => {
    const position = calculatePosition({
      incomeCents: 0,
      housingCents: 0,
      otherExpensesCents: 0,
      debtPaymentsCents: 0,
      plannedSavingsCents: 0,
    });

    expect(position.housingToIncomeRatio).toBeNull();
    expect(position.savingsRate).toBeNull();
    expect(position.expenseToIncomeRatio).toBeNull();
    expect(position.coreSurplusRate).toBeNull();
    expect(position.flexibleCashRate).toBeNull();
  });

  it("supports zero expenses", () => {
    const position = calculatePosition({
      incomeCents: 100_000,
      housingCents: 0,
      otherExpensesCents: 0,
      debtPaymentsCents: 0,
      plannedSavingsCents: 0,
    });

    expect(position.nonSavingsOutflowsCents).toBe(0);
    expect(position.coreSurplusCents).toBe(100_000);
    expect(position.expenseToIncomeRatio).toBe(0);
  });

  it("preserves a negative surplus", () => {
    const position = calculatePosition({
      incomeCents: 100_000,
      housingCents: 80_000,
      otherExpensesCents: 30_000,
      debtPaymentsCents: 5_000,
      plannedSavingsCents: 0,
    });

    expect(position.coreSurplusCents).toBe(-15_000);
    expect(position.remainingFlexibleCashCents).toBe(-15_000);
  });

  it("allows planned savings above core surplus and reports negative flexible cash", () => {
    const position = calculatePosition({
      incomeCents: 100_000,
      housingCents: 40_000,
      otherExpensesCents: 20_000,
      debtPaymentsCents: 0,
      plannedSavingsCents: 50_000,
    });

    expect(position.coreSurplusCents).toBe(40_000);
    expect(position.remainingFlexibleCashCents).toBe(-10_000);
  });

  it("calculates safely at the per-field maximum", () => {
    const position = calculatePosition({
      incomeCents: 100_000_000,
      housingCents: 100_000_000,
      otherExpensesCents: 100_000_000,
      debtPaymentsCents: 100_000_000,
      plannedSavingsCents: 100_000_000,
    });

    expect(position.coreSurplusCents).toBe(-200_000_000);
    expect(position.remainingFlexibleCashCents).toBe(-300_000_000);
    expect(Number.isSafeInteger(position.remainingFlexibleCashCents)).toBe(
      true,
    );
  });
});
