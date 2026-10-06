import type { Baseline } from "../../domain/types";
import type { EntityMetadata, WorkspaceId } from "./types";
export type LegacyV1BaselineSnapshot = EntityMetadata &
  Readonly<{
    id: string;
    workspaceId: WorkspaceId;
    provenance: "legacy-v1";
    originalSavedAt: string;
    migratedAt: string;
    completeness: "monthly-aggregate-only";
    baseline: Baseline;
  }>;
