import { describe, expect, it } from "vitest";

import {
  customBaselineInputSchema,
  baselineSchema,
} from "../../src/domain/schemas.js";

describe("baseline validation", () => {
  it("maps the five custom fields to integer-cent domain data", () => {
    expect(
      customBaselineInputSchema.parse({
        monthlyTakeHomeIncome: "$3,000.00",
        housing: "1200",
        otherMonthlyExpenses: "750.25",
        debtPayments: "200",
        plannedSavings: "300",
      }),
    ).toEqual({
      incomeCents: 300_000,
      housingCents: 120_000,
      otherExpensesCents: 75_025,
      debtPaymentsCents: 20_000,
      plannedSavingsCents: 30_000,
    });
  });

  it.each([
    ["negative income", { incomeCents: -1 }],
    ["negative housing", { housingCents: -1 }],
    ["negative other expenses", { otherExpensesCents: -1 }],
    ["negative debt", { debtPaymentsCents: -1 }],
    ["negative savings", { plannedSavingsCents: -1 }],
  ])("rejects %s", (_label, changed) => {
    const baseline = {
      incomeCents: 0,
      housingCents: 0,
      otherExpensesCents: 0,
      debtPaymentsCents: 0,
      plannedSavingsCents: 0,
      ...changed,
    };
    expect(baselineSchema.safeParse(baseline).success).toBe(false);
  });

  it("rejects fractional cents and values over the cap", () => {
    const valid = {
      incomeCents: 0,
      housingCents: 0,
      otherExpensesCents: 0,
      debtPaymentsCents: 0,
      plannedSavingsCents: 0,
    };
    expect(
      baselineSchema.safeParse({ ...valid, incomeCents: 0.5 }).success,
    ).toBe(false);
    expect(
      baselineSchema.safeParse({ ...valid, incomeCents: 100_000_001 }).success,
    ).toBe(false);
  });

  it("does not reject a deficit-producing baseline", () => {
    expect(
      baselineSchema.safeParse({
        incomeCents: 100,
        housingCents: 100,
        otherExpensesCents: 100,
        debtPaymentsCents: 100,
        plannedSavingsCents: 100,
      }).success,
    ).toBe(true);
  });
});
