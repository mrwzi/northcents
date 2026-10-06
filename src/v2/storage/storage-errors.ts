export type StorageErrorCode =
  | "indexeddb-unavailable"
  | "database-open-failed"
  | "transaction-failed"
  | "quota-exceeded"
  | "workspace-not-found"
  | "corrupted-workspace"
  | "unsupported-workspace-version"
  | "invalid-active-workspace"
  | "invalid-migration-source"
  | "invalid-import"
  | "unsupported-export-version"
  | "workspace-id-collision";

/** Error details intentionally contain identifiers/reasons, never financial data. */
export class MoneveroStorageError extends Error {
  constructor(
    readonly code: StorageErrorCode,
    message: string,
    readonly detail?: Readonly<Record<string, string | number | boolean>>,
  ) {
    super(message);
    this.name = "MoneveroStorageError";
  }
}

export function toStorageError(
  error: unknown,
  fallbackCode: StorageErrorCode,
  fallbackMessage: string,
): MoneveroStorageError {
  if (error instanceof MoneveroStorageError) return error;
  if (error instanceof DOMException && error.name === "QuotaExceededError")
    return new MoneveroStorageError(
      "quota-exceeded",
      "Local storage quota was exceeded.",
    );
  return new MoneveroStorageError(fallbackCode, fallbackMessage);
}
