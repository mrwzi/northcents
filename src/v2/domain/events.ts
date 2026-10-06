import type {
  CalendarDate,
  AllocationLinkId,
  FinancialEntityId,
  FinancialEventId,
  FinancialEventStatus,
  ObligationClassification,
  PersonalProvenance,
  V2Cents,
} from "./types";
export type FinancialEventKind =
  | "income"
  | "expense"
  | "debt-payment"
  | "goal-transfer"
  | "sinking-fund-reservation";
export type CashEffect =
  "spendable-cash" | "allocation-only" | "settlement-of-allocation";
export type FinancialEvent = Readonly<{
  id: FinancialEventId;
  date: CalendarDate;
  amountCents: V2Cents;
  direction: "inflow" | "outflow";
  kind: FinancialEventKind;
  sourceEntityId: FinancialEntityId;
  obligation: ObligationClassification;
  status: FinancialEventStatus;
  provenance: PersonalProvenance;
  label: string;
  cashEffect: CashEffect;
  allocationLinkId?: AllocationLinkId;
  settlesAllocationLinkId?: AllocationLinkId;
}>;
export type EventLinkIssue = Readonly<{
  code:
    | "duplicate-allocation-link"
    | "duplicate-settlement-link"
    | "missing-allocation";
  linkId: AllocationLinkId;
}>;
export function validateEventLinks(
  events: readonly FinancialEvent[],
): readonly EventLinkIssue[] {
  const allocations = new Map<AllocationLinkId, number>();
  const settlements = new Map<AllocationLinkId, number>();
  for (const event of events) {
    if (event.allocationLinkId)
      allocations.set(
        event.allocationLinkId,
        (allocations.get(event.allocationLinkId) ?? 0) + 1,
      );
    if (event.settlesAllocationLinkId)
      settlements.set(
        event.settlesAllocationLinkId,
        (settlements.get(event.settlesAllocationLinkId) ?? 0) + 1,
      );
  }
  const issues: EventLinkIssue[] = [];
  for (const [linkId, count] of allocations)
    if (count > 1) issues.push({ code: "duplicate-allocation-link", linkId });
  for (const [linkId, count] of settlements) {
    if (count > 1) issues.push({ code: "duplicate-settlement-link", linkId });
    if (!allocations.has(linkId))
      issues.push({ code: "missing-allocation", linkId });
  }
  return issues;
}
