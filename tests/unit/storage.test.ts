import { describe, expect, it } from "vitest";

import { getDemoProfile } from "../../src/data/demo-profiles.js";
import {
  BASELINE_STORAGE_KEY,
  clearBaseline,
  loadBaseline,
  saveBaseline,
  type StorageLike,
} from "../../src/storage/baseline-storage.js";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const baseline = getDemoProfile("student-renter").baseline;
const now = new Date("2026-09-21T12:00:00.000Z");

describe("local-only baseline storage contract", () => {
  it("returns empty when no baseline was stored", () => {
    expect(loadBaseline(new MemoryStorage(), now)).toEqual({ status: "empty" });
  });

  it("saves and loads the current version as user-entered data", () => {
    const storage = new MemoryStorage();
    const saved = saveBaseline(storage, baseline, now);

    expect(saved.version).toBe(1);
    expect(loadBaseline(storage, now)).toEqual({
      status: "loaded",
      value: { source: "user-entered", baseline },
      migrated: false,
      savedAt: now.toISOString(),
    });
  });

  it("migrates the supported pre-release version zero shape", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      BASELINE_STORAGE_KEY,
      JSON.stringify({ version: 0, baseline }),
    );

    const result = loadBaseline(storage, now);
    expect(result).toMatchObject({ status: "loaded", migrated: true });
    expect(
      JSON.parse(storage.getItem(BASELINE_STORAGE_KEY) ?? "null"),
    ).toMatchObject({
      version: 1,
      savedAt: now.toISOString(),
      baseline,
    });
  });

  it("removes malformed JSON and reports a reset", () => {
    const storage = new MemoryStorage();
    storage.setItem(BASELINE_STORAGE_KEY, "not-json");

    expect(loadBaseline(storage, now)).toEqual({
      status: "reset",
      reason: "malformed",
    });
    expect(storage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });

  it("removes malformed recognized data and reports a reset", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      BASELINE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: "no",
        baseline: { incomeCents: -1 },
      }),
    );

    expect(loadBaseline(storage, now)).toEqual({
      status: "reset",
      reason: "malformed",
    });
    expect(storage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });

  it("removes unsupported versions and reports why", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      BASELINE_STORAGE_KEY,
      JSON.stringify({ version: 99, baseline }),
    );

    expect(loadBaseline(storage, now)).toEqual({
      status: "reset",
      reason: "unsupported-version",
    });
    expect(storage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });

  it("clears saved user data", () => {
    const storage = new MemoryStorage();
    saveBaseline(storage, baseline, now);
    clearBaseline(storage);
    expect(storage.getItem(BASELINE_STORAGE_KEY)).toBeNull();
  });
});
