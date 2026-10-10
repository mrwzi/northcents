import type {
  AccountGroupId,
  EntityMetadata,
  PersonalProvenance,
  WorkspaceId,
} from "./types";

export const ACCOUNT_GROUP_TYPES = [
  "bank",
  "credit-union",
  "online-bank",
  "investment-platform",
  "crypto-platform",
  "education-provider",
  "cash",
  "other",
] as const;

export type AccountGroupType = (typeof ACCOUNT_GROUP_TYPES)[number];

/** A manually named place or provider that can contain several accounts. */
export type AccountGroup = EntityMetadata &
  Readonly<{
    id: AccountGroupId;
    workspaceId: WorkspaceId;
    name: string;
    type: AccountGroupType;
    status: "active" | "archived";
    provenance: PersonalProvenance;
  }>;
