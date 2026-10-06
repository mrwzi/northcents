import type { Recurrence } from "./recurrence";
import type {
  CalendarDate,
  EntityMetadata,
  GoalId,
  PersonalProvenance,
  V2Cents,
  WorkspaceId,
} from "./types";
export type GoalType =
  | "emergency-fund"
  | "tuition"
  | "vehicle"
  | "travel"
  | "general-savings"
  | "custom";
export type GoalStatus = "active" | "paused" | "completed";
export type FinancialGoal = EntityMetadata &
  Readonly<{
    id: GoalId;
    workspaceId: WorkspaceId;
    name: string;
    type: GoalType;
    currentAmountCents: V2Cents;
    targetAmountCents: V2Cents;
    plannedContributionCents: V2Cents;
    contributionRecurrence?: Recurrence;
    deadline?: CalendarDate;
    status: GoalStatus;
    provenance: PersonalProvenance;
  }>;
