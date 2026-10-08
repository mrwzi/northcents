"use client";

import { useLocalBaseline } from "../../hooks/useLocalBaseline";
import { LoadingState } from "../shared/LoadingState";
import { StorageNotice } from "./StorageNotice";

export function LocalDataControls() {
  const localBaseline = useLocalBaseline();

  if (localBaseline.status === "loading")
    return <LoadingState label="Checking saved data…" />;

  return (
    <section className="data-controls" aria-labelledby="data-controls-heading">
      <h2 id="data-controls-heading">Local data controls</h2>
      {localBaseline.notice === null ? null : (
        <StorageNotice
          notice={localBaseline.notice}
          onDismiss={localBaseline.dismissNotice}
        />
      )}
      <p>
        {localBaseline.value === null
          ? "No custom baseline is saved in this browser."
          : "A custom baseline is saved in this browser."}
      </p>
      <button
        className="button button-secondary"
        disabled={localBaseline.value === null}
        type="button"
        onClick={localBaseline.clear}
      >
        Clear my data
      </button>
    </section>
  );
}
