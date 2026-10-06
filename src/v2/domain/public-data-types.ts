import type { CalendarDate, PublicDataProvenance } from "./types";
export type PublicDataFreshness = "current" | "stale" | "unavailable";
export type PublicDataObservation = Readonly<{
  provenance: PublicDataProvenance;
  sourceOrganization: string;
  datasetId: string;
  seriesId?: string;
  geography: Readonly<{ code: string; label: string }>;
  observationDate: CalendarDate;
  retrievedAt: string;
  unit: string;
  value: string | number;
  freshness: PublicDataFreshness;
  limitations: readonly string[];
  sourceUrl: string;
}>;
