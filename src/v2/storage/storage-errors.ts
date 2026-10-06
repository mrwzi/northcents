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
export class NorthCentsStorageError extends Error {
  constructor(
    readonly code: StorageErrorCode,
    message: string,
    readonly detail?: Readonly<Record<string, string | number | boolean>>,
  ) {
    super(message);
    this.name = "NorthCentsStorageError";
  }
}

export function toStorageError(
  error: unknown,
  fallbackCode: StorageErrorCode,
  fallbackMessage: string,
): NorthCentsStorageError {
  if (error instanceof NorthCentsStorageError) return error;
  if (error instanceof DOMException && error.name === "QuotaExceededError")
    return new NorthCentsStorageError(
      "quota-exceeded",
      "Local storage quota was exceeded.",
    );
  return new NorthCentsStorageError(fallbackCode, fallbackMessage);
}
