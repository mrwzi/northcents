"use client";

import { useCallback, useEffect, useState } from "react";

import type { Baseline, UserBaseline } from "../domain/types";
import {
  clearBaseline as clearStoredBaseline,
  loadBaseline,
  saveBaseline as saveStoredBaseline,
} from "../storage/baseline-storage";

type LocalBaselineStatus = "loading" | "empty" | "loaded";

export type StorageNotice = Readonly<{
  kind: "migrated" | "reset";
  message: string;
}>;

export function useLocalBaseline() {
  const [status, setStatus] = useState<LocalBaselineStatus>("loading");
  const [value, setValue] = useState<UserBaseline | null>(null);
  const [notice, setNotice] = useState<StorageNotice | null>(null);

  useEffect(() => {
    const result = loadBaseline(window.localStorage);
    if (result.status === "loaded") {
      setValue(result.value);
      setStatus("loaded");
      if (result.migrated) {
        setNotice({
          kind: "migrated",
          message:
            "Your locally saved baseline was updated to the current storage format.",
        });
      }
      return;
    }

    setValue(null);
    setStatus("empty");
    if (result.status === "reset") {
      setNotice({
        kind: "reset",
        message:
          "Saved browser data could not be safely restored and was reset. You can enter a new baseline below.",
      });
    }
  }, []);

  const save = useCallback((baseline: Baseline) => {
    saveStoredBaseline(window.localStorage, baseline);
    setValue({ source: "user-entered", baseline });
    setStatus("loaded");
    setNotice(null);
  }, []);

  const clear = useCallback(() => {
    clearStoredBaseline(window.localStorage);
    setValue(null);
    setStatus("empty");
    setNotice(null);
  }, []);

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  return { status, value, notice, save, clear, dismissNotice } as const;
}
