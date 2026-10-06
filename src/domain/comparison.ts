import { formatCad } from "./money";
import type {
  CalculatedPosition,
  ImpactDirection,
  ImpactExplanation,
  MetricDifference,
  PositionComparison,
  Scenario,
} from "./types";

function moneyDifference(current: number, scenario: number): MetricDifference {
  const delta = scenario - current;
  return { current, scenario, delta, annualDelta: delta * 12 };
}

function ratioDifference(
  current: number | null,
  scenario: number | null,
): MetricDifference {
  return {
    current,
    scenario,
    delta: current === null || scenario === null ? null : scenario - current,
  };
}

function relativeChange(current: number, scenario: number): number | null {
  if (current === 0) return null;
  return (scenario - current) / Math.abs(current);
}

export function comparePositions(
  current: CalculatedPosition,
  scenario: CalculatedPosition,
): PositionComparison {
  return {
    income: moneyDifference(current.incomeCents, scenario.incomeCents),
    housing: moneyDifference(current.housingCents, scenario.housingCents),
    otherExpenses: moneyDifference(
      current.otherExpensesCents,
      scenario.otherExpensesCents,
    ),
    debtPayments: moneyDifference(
      current.debtPaymentsCents,
      scenario.debtPaymentsCents,
    ),
    nonSavingsOutflows: moneyDifference(
      current.nonSavingsOutflowsCents,
      scenario.nonSavingsOutflowsCents,
    ),
    coreSurplus: moneyDifference(
      current.coreSurplusCents,
      scenario.coreSurplusCents,
    ),
    plannedSavings: moneyDifference(
      current.plannedSavingsCents,
      scenario.plannedSavingsCents,
    ),
    remainingFlexibleCash: moneyDifference(
      current.remainingFlexibleCashCents,
      scenario.remainingFlexibleCashCents,
    ),
    housingToIncomeRatio: ratioDifference(
      current.housingToIncomeRatio,
      scenario.housingToIncomeRatio,
    ),
    savingsRate: ratioDifference(current.savingsRate, scenario.savingsRate),
    expenseToIncomeRatio: ratioDifference(
      current.expenseToIncomeRatio,
      scenario.expenseToIncomeRatio,
    ),
    coreSurplusRelativeChange: relativeChange(
      current.coreSurplusCents,
      scenario.coreSurplusCents,
    ),
  };
}

function directionOf(delta: number): ImpactDirection {
  if (delta > 0) return "increase";
  if (delta < 0) return "decrease";
  return "unchanged";
}

export function describeImpact(
  comparison: PositionComparison,
  scenario: Scenario,
): ImpactExplanation {
  const monthlyDifferenceCents = comparison.remainingFlexibleCash.delta ?? 0;
  const annualDifferenceCents =
    comparison.remainingFlexibleCash.annualDelta ?? 0;
  const direction = directionOf(monthlyDifferenceCents);
  const magnitude = formatCad(Math.abs(monthlyDifferenceCents));
  const message =
    direction === "unchanged"
      ? "Your remaining flexible cash is unchanged in this scenario."
      : `Your remaining flexible cash ${direction}s by ${magnitude} per month in this scenario.`;

  return {
    metric: "remaining-flexible-cash",
    scenarioType: scenario.type,
    direction,
    monthlyDifferenceCents,
    annualDifferenceCents,
    message,
    isEstimate: true,
    isRecommendation: false,
  };
}
