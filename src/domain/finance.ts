import { baselineSchema } from "./schemas";
import type { Baseline, CalculatedPosition, Ratio } from "./types";

function ratio(numerator: number, incomeCents: number): Ratio {
  return incomeCents === 0 ? null : numerator / incomeCents;
}

export function calculatePosition(input: Baseline): CalculatedPosition {
  const baseline = baselineSchema.parse(input);
  const nonSavingsOutflowsCents =
    baseline.housingCents +
    baseline.otherExpensesCents +
    baseline.debtPaymentsCents;
  const coreSurplusCents = baseline.incomeCents - nonSavingsOutflowsCents;
  const remainingFlexibleCashCents =
    coreSurplusCents - baseline.plannedSavingsCents;

  return {
    ...baseline,
    nonSavingsOutflowsCents,
    coreSurplusCents,
    remainingFlexibleCashCents,
    housingToIncomeRatio: ratio(baseline.housingCents, baseline.incomeCents),
    savingsRate: ratio(baseline.plannedSavingsCents, baseline.incomeCents),
    expenseToIncomeRatio: ratio(nonSavingsOutflowsCents, baseline.incomeCents),
    coreSurplusRate: ratio(coreSurplusCents, baseline.incomeCents),
    flexibleCashRate: ratio(remainingFlexibleCashCents, baseline.incomeCents),
  };
}
