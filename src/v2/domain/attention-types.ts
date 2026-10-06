import type {
  CalendarDate,
  FinancialEntityId,
  PersonalProvenance,
} from "./types";
export const DEFAULT_UPCOMING_WINDOW_DAYS = 7;
export type AttentionLevel =
  "information" | "upcoming" | "attention" | "urgent";
export type AttentionItem = Readonly<{
  id: string;
  conditionId: string;
  level: AttentionLevel;
  message: Readonly<{
    templateId: string;
    values: Readonly<Record<string, string | number | null>>;
  }>;
  relatedEntityIds: readonly FinancialEntityId[];
  relevantDate?: CalendarDate;
  trace: Readonly<{
    inputRefs: readonly string[];
    calculatedValues: Readonly<Record<string, string | number | null>>;
    methodologyId: string;
  }>;
  provenance?: PersonalProvenance;
}>;
