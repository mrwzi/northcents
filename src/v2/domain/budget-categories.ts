export const BUDGET_CATEGORIES = {
  housing: "Housing",
  utilities: "Utilities",
  groceries: "Groceries",
  restaurants: "Restaurants / eating out",
  transportation: "Transportation",
  insurance: "Insurance",
  "phone-internet": "Phone / internet",
  "health-personal-care": "Health / personal care",
  education: "Education",
  subscriptions: "Subscriptions",
  "entertainment-recreation": "Entertainment / recreation",
  clothing: "Clothing",
  shopping: "Shopping",
  "debt-payments": "Debt payments",
  "savings-goals": "Savings / goals",
  other: "Other",
} as const;
export type BudgetCategoryKey = keyof typeof BUDGET_CATEGORIES;
export const BUDGET_CATEGORY_KEYS = Object.keys(
  BUDGET_CATEGORIES,
) as readonly BudgetCategoryKey[];
export function isBudgetCategoryKey(value: string): value is BudgetCategoryKey {
  return value in BUDGET_CATEGORIES;
}
