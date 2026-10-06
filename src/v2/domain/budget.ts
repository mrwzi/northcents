import type { BudgetCategoryKey } from "./budget-categories";
import { addCents, asV2Cents, subtractCents } from "./money";
import type { BasisPoints, V2Cents } from "./types";

export type BudgetAllocation = Readonly<{
  category: BudgetCategoryKey;
  amountCents: V2Cents;
}>;

export type BudgetCheck = Readonly<{
  id:
    | "exact-reconciliation"
    | "affordability"
    | "debt-visibility"
    | "emergency-visibility"
    | "benchmark-context";
  status: "pass" | "attention" | "information";
  message: string;
}>;

export type BudgetAnalysis = Readonly<{
  availableCents: V2Cents;
  allocatedCents: V2Cents;
  unallocatedCents: V2Cents;
  allocations: readonly (BudgetAllocation & {
    shareOfAvailableBasisPoints: BasisPoints | null;
  })[];
  checks: readonly BudgetCheck[];
}>;

export const EMERGENCY_STARTER_BASIS_POINTS = 500 as BasisPoints;

/**
 * Scales a user's own monthly category pattern to a single paycheque.
 * Required debt payments remain a fixed floor; every other positive category
 * is distributed proportionally with deterministic largest-remainder rounding.
 * This produces an editable draft and does not represent a money transfer.
 */
export function suggestPaychequeSplit(
  paychequeCents: V2Cents,
  monthlyAllocations: readonly BudgetAllocation[],
  requiredDebtPaymentCents: V2Cents,
): readonly BudgetAllocation[] {
  if (paychequeCents < 0 || requiredDebtPaymentCents < 0)
    throw new RangeError("Paycheque and required debt must be non-negative.");

  const seen = new Set<BudgetCategoryKey>();
  const weighted = monthlyAllocations.filter((allocation) => {
    if (allocation.amountCents < 0)
      throw new RangeError("Budget allocations must be non-negative.");
    if (seen.has(allocation.category))
      throw new RangeError("Budget categories must be unique.");
    seen.add(allocation.category);
    return (
      allocation.category !== "debt-payments" && allocation.amountCents > 0
    );
  });
  const distributable = asV2Cents(
    Math.max(0, paychequeCents - requiredDebtPaymentCents),
  );
  const totalWeight = weighted.reduce(
    (total, allocation) => total + BigInt(allocation.amountCents),
    0n,
  );
  const result: BudgetAllocation[] = [];

  if (requiredDebtPaymentCents > 0)
    result.push({
      category: "debt-payments",
      amountCents: requiredDebtPaymentCents,
    });

  if (totalWeight === 0n || distributable === 0) return result;

  const target = BigInt(distributable);
  const shares = weighted.map((allocation, index) => {
    const numerator = target * BigInt(allocation.amountCents);
    return {
      allocation,
      index,
      cents: numerator / totalWeight,
      remainder: numerator % totalWeight,
    };
  });
  let remaining =
    target - shares.reduce((total, share) => total + share.cents, 0n);
  const remainderOrder = [...shares].sort((left, right) => {
    if (left.remainder === right.remainder) return left.index - right.index;
    return left.remainder > right.remainder ? -1 : 1;
  });
  for (const share of remainderOrder) {
    if (remaining === 0n) break;
    share.cents += 1n;
    remaining -= 1n;
  }
  result.push(
    ...shares.map(({ allocation, cents }) => ({
      category: allocation.category,
      amountCents: asV2Cents(Number(cents)),
    })),
  );
  return result;
}

/**
 * Returns an editable emergency-savings starting amount using exact integer
 * arithmetic. This is a planning prompt, not a required or universal target.
 */
export function suggestEmergencyStarter(
  availableCents: V2Cents,
  basisPoints: BasisPoints = EMERGENCY_STARTER_BASIS_POINTS,
): V2Cents {
  if (availableCents < 0)
    throw new RangeError("Planning money must be zero or positive.");
  if (!Number.isInteger(basisPoints) || basisPoints < 0 || basisPoints > 10_000)
    throw new RangeError("Starter percentage must be between 0% and 100%.");
  const numerator = BigInt(availableCents) * BigInt(basisPoints);
  return asV2Cents(Number((numerator + 5_000n) / 10_000n));
}

function ratioBasisPoints(amount: V2Cents, total: V2Cents): BasisPoints | null {
  if (total <= 0) return null;
  const numerator = BigInt(amount) * 10_000n;
  const rounded = (numerator + BigInt(total) / 2n) / BigInt(total);
  return Number(rounded) as BasisPoints;
}

export function analyzeBudget(
  availableCents: V2Cents,
  allocations: readonly BudgetAllocation[],
  options: Readonly<{ hasDebt: boolean }>,
): BudgetAnalysis {
  if (availableCents < 0)
    throw new RangeError("Planning money must be zero or positive.");
  const categories = new Set<BudgetCategoryKey>();
  let allocatedCents = asV2Cents(0);
  for (const allocation of allocations) {
    if (allocation.amountCents < 0)
      throw new RangeError("Budget allocations must be non-negative.");
    if (categories.has(allocation.category))
      throw new RangeError("Budget categories must be unique.");
    categories.add(allocation.category);
    allocatedCents = addCents(allocatedCents, allocation.amountCents);
  }
  const unallocatedCents = subtractCents(availableCents, allocatedCents);
  const debtAmount =
    allocations.find((item) => item.category === "debt-payments")
      ?.amountCents ?? 0;
  const emergencyAmount =
    allocations.find((item) => item.category === "savings-goals")
      ?.amountCents ?? 0;
  return {
    availableCents,
    allocatedCents,
    unallocatedCents,
    allocations: allocations.map((allocation) => ({
      ...allocation,
      shareOfAvailableBasisPoints: ratioBasisPoints(
        allocation.amountCents,
        availableCents,
      ),
    })),
    checks: [
      {
        id: "exact-reconciliation",
        status: "pass",
        message: "Every entered cent is included exactly once.",
      },
      {
        id: "affordability",
        status: unallocatedCents < 0 ? "attention" : "pass",
        message:
          unallocatedCents < 0
            ? "Planned amounts exceed the money selected for this plan."
            : "Planned amounts do not exceed the money selected for this plan.",
      },
      {
        id: "debt-visibility",
        status: options.hasDebt && debtAmount === 0 ? "attention" : "pass",
        message:
          options.hasDebt && debtAmount === 0
            ? "You entered money owed, but this draft has no debt-payment amount."
            : "Debt-payment information is represented consistently with your entries.",
      },
      {
        id: "emergency-visibility",
        status: emergencyAmount === 0 ? "information" : "pass",
        message:
          emergencyAmount === 0
            ? "No emergency savings amount is included in this draft."
            : "This draft includes an emergency or savings allocation.",
      },
      {
        id: "benchmark-context",
        status: "information",
        message:
          "Canadian reference figures are comparisons only, not personalized targets.",
      },
    ],
  };
}

export type PurchaseImpact = Readonly<{
  purchaseCents: V2Cents;
  remainingAvailableCents: V2Cents;
  categoryRemainingCents: V2Cents | null;
  exceedsAvailable: boolean;
  exceedsCategoryPlan: boolean | null;
}>;

/** Models a purchase without changing accounts or the saved plan. */
export function modelPurchase(
  analysis: BudgetAnalysis,
  category: BudgetCategoryKey,
  purchaseCents: V2Cents,
): PurchaseImpact {
  if (purchaseCents < 0)
    throw new RangeError("Purchase amount must be non-negative.");
  const categoryAllocation = analysis.allocations.find(
    (allocation) => allocation.category === category,
  );
  const categoryRemainingCents = categoryAllocation
    ? subtractCents(categoryAllocation.amountCents, purchaseCents)
    : null;
  return {
    purchaseCents,
    remainingAvailableCents: subtractCents(
      analysis.availableCents,
      purchaseCents,
    ),
    categoryRemainingCents,
    exceedsAvailable: purchaseCents > analysis.availableCents,
    exceedsCategoryPlan:
      categoryRemainingCents === null ? null : categoryRemainingCents < 0,
  };
}
