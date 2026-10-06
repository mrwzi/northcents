import type {
  AllocationRuleId,
  BasisPoints,
  EntityMetadata,
  PersonalProvenance,
  V2Cents,
  WorkspaceId,
} from "./types";
import type { BudgetCategoryKey } from "./budget-categories";

export const PLANNING_GROUPS = [
  "required-obligations",
  "essential-flexible",
  "protection-reserves",
  "long-term-building",
  "lifestyle-flexible",
] as const;
export type PlanningGroup = (typeof PLANNING_GROUPS)[number];

export type AllocationRule = EntityMetadata &
  Readonly<{
    id: AllocationRuleId;
    workspaceId: WorkspaceId;
    name: string;
    category?: BudgetCategoryKey;
    group: PlanningGroup;
    provenance: PersonalProvenance;
    enabled: boolean;
    strategy:
      | Readonly<{ kind: "fixed-amount"; amountCents: V2Cents }>
      | Readonly<{ kind: "percentage-of-income"; basisPoints: BasisPoints }>
      | Readonly<{ kind: "reserve-for-obligations" }>
      | Readonly<{ kind: "debt-minimums" }>;
  }>;

export const REMINDER_CADENCES = [
  "weekly",
  "biweekly",
  "monthly",
  "never",
] as const;
export type ReminderCadence = (typeof REMINDER_CADENCES)[number];

export type ReminderPreferences = Readonly<{
  accountReviewCadence: ReminderCadence;
}>;
