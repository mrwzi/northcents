import {
  storedBaselineV0Schema,
  storedBaselineV1Schema,
  type StoredBaselineV1,
} from "../domain/schemas";
import type { Baseline, UserBaseline } from "../domain/types";

export const BASELINE_STORAGE_KEY = "finscope:baseline:v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type LoadBaselineResult =
  | Readonly<{ status: "empty" }>
  | Readonly<{
      status: "loaded";
      value: UserBaseline;
      migrated: boolean;
      savedAt: string;
    }>
  | Readonly<{ status: "reset"; reason: "malformed" | "unsupported-version" }>;

export function createStoredBaseline(
  baseline: Baseline,
  now: Date = new Date(),
): StoredBaselineV1 {
  return storedBaselineV1Schema.parse({
    version: 1,
    savedAt: now.toISOString(),
    baseline,
  });
}

export function saveBaseline(
  storage: StorageLike,
  baseline: Baseline,
  now: Date = new Date(),
): StoredBaselineV1 {
  const stored = createStoredBaseline(baseline, now);
  storage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(stored));
  return stored;
}

export function loadBaseline(
  storage: StorageLike,
  now: Date = new Date(),
): LoadBaselineResult {
  const serialized = storage.getItem(BASELINE_STORAGE_KEY);
  if (serialized === null) return { status: "empty" };

  let raw: unknown;
  try {
    raw = JSON.parse(serialized) as unknown;
  } catch {
    storage.removeItem(BASELINE_STORAGE_KEY);
    return { status: "reset", reason: "malformed" };
  }

  const current = storedBaselineV1Schema.safeParse(raw);
  if (current.success) {
    return {
      status: "loaded",
      value: { source: "user-entered", baseline: current.data.baseline },
      migrated: false,
      savedAt: current.data.savedAt,
    };
  }

  const migrated = migrateStoredBaseline(raw, now);
  if (migrated !== null) {
    storage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(migrated));
    return {
      status: "loaded",
      value: { source: "user-entered", baseline: migrated.baseline },
      migrated: true,
      savedAt: migrated.savedAt,
    };
  }

  const reason = hasRecognizedVersionShape(raw)
    ? "malformed"
    : "unsupported-version";
  storage.removeItem(BASELINE_STORAGE_KEY);
  return { status: "reset", reason };
}

export function clearBaseline(storage: StorageLike): void {
  storage.removeItem(BASELINE_STORAGE_KEY);
}

export function migrateStoredBaseline(
  raw: unknown,
  now: Date = new Date(),
): StoredBaselineV1 | null {
  const legacy = storedBaselineV0Schema.safeParse(raw);
  if (!legacy.success) return null;
  return createStoredBaseline(legacy.data.baseline, now);
}

function hasRecognizedVersionShape(raw: unknown): boolean {
  if (typeof raw !== "object" || raw === null || !("version" in raw))
    return false;
  return raw.version === 0 || raw.version === 1;
}
