"use client";

import { useRouter } from "next/navigation";

import { useLocalBaseline } from "../../hooks/useLocalBaseline";
import { BaselineForm } from "./BaselineForm";
import { StorageNotice } from "./StorageNotice";

export function BuildBaselineExperience() {
  const router = useRouter();
  const localBaseline = useLocalBaseline();

  if (localBaseline.status === "loading") {
    return <p role="status">Checking for a locally saved baseline…</p>;
  }

  return (
    <div className="simple-form-layout">
      <div>
        {localBaseline.notice === null ? null : (
          <StorageNotice
            notice={localBaseline.notice}
            onDismiss={localBaseline.dismissNotice}
          />
        )}
        {localBaseline.value === null ? null : (
          <div className="saved-note" role="status">
            <p>A saved baseline was restored from this browser.</p>
            <button
              className="text-button"
              type="button"
              onClick={localBaseline.clear}
            >
              Clear saved baseline
            </button>
          </div>
        )}
        <BaselineForm
          {...(localBaseline.value === null
            ? {}
            : { initialBaseline: localBaseline.value.baseline })}
          onValidSubmit={(baseline) => {
            localBaseline.save(baseline);
            router.push("/scenario?source=user");
          }}
        />
      </div>
      <p className="form-privacy-note">
        Stored only in this browser. No bank connection or account required.
      </p>
    </div>
  );
}
