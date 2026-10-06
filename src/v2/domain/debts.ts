import type {
  BasisPoints,
  CalendarDate,
  DebtId,
  EntityMetadata,
  PersonalProvenance,
  V2Cents,
  WorkspaceId,
} from "./types";
export type DebtType =
  | "credit-card"
  | "line-of-credit"
  | "student-loan"
  | "personal-loan"
  | "auto-loan"
  | "family"
  | "other";
export type DebtInterestModel =
  | Readonly<{ kind: "interest-free"; modelVersion: 1 }>
  | Readonly<{
      kind: "apr-estimate";
      modelVersion: 1;
      aprBasisPoints: BasisPoints;
      dayCount: "actual-365";
      interestPosting: "monthly";
      rounding: "half-away-from-zero-at-posting";
    }>;
export type Debt = EntityMetadata &
  Readonly<{
    id: DebtId;
    workspaceId: WorkspaceId;
    name: string;
    type: DebtType;
    currentBalanceCents: V2Cents;
    balanceAsOfDate: CalendarDate;
    interestModel: DebtInterestModel;
    minimumPaymentCents: V2Cents;
    plannedPaymentCents: V2Cents;
    dueDay: number;
    deadline?: CalendarDate;
    provenance: PersonalProvenance;
  }>;
