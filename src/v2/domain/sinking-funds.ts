import type { Recurrence } from "./recurrence";
import type {
  CalendarDate,
  EntityMetadata,
  ExpenseEventId,
  PersonalProvenance,
  SinkingFundId,
  V2Cents,
  WorkspaceId,
} from "./types";
export type SinkingFund = EntityMetadata &
  Readonly<{
    id: SinkingFundId;
    workspaceId: WorkspaceId;
    name: string;
    targetAmountCents: V2Cents;
    reservedCents: V2Cents;
    dueDate: CalendarDate;
    contributionRecurrence?: Recurrence;
    nextContributionDate?: CalendarDate;
    linkedExpenseEventId?: ExpenseEventId;
    provenance: PersonalProvenance;
  }>;
