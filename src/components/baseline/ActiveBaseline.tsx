"use client";

import Link from "next/link";

import { getDemoProfile } from "../../data/demo-profiles";
import type { DemoProfileId } from "../../domain/types";
import { useLocalBaseline } from "../../hooks/useLocalBaseline";
import { ScenarioLab } from "../scenario/ScenarioLab";
import type { ScenarioType } from "../scenario/ScenarioPicker";
import { StorageNotice } from "./StorageNotice";
import { LoadingState } from "../shared/LoadingState";

export function ActiveBaseline({
  profileId,
  initialScenarioType,
}: Readonly<{
  profileId: DemoProfileId | null | "invalid";
  initialScenarioType?: ScenarioType;
}>) {
  const localBaseline = useLocalBaseline();

  if (profileId === "invalid") {
    return (
      <div className="empty-state">
        <p className="eyebrow">Profile not found</p>
        <h1>That demo profile is not available.</h1>
        <p>Choose one of the four audited synthetic profiles to continue.</p>
        <Link className="button button-primary" href="/explore">
          View demo profiles
        </Link>
      </div>
    );
  }

  if (profileId !== null) {
    const profile = getDemoProfile(profileId);
    return (
      <ScenarioLab
        baseline={profile.baseline}
        heading={profile.name}
        sourceLabel="Synthetic demo"
        description="This active baseline uses synthetic example data and has not replaced any custom baseline saved in your browser."
        {...(initialScenarioType === undefined
          ? {}
          : { initialType: initialScenarioType })}
      />
    );
  }

  if (localBaseline.status === "loading") {
    return <LoadingState label="Loading your saved picture…" />;
  }

  if (localBaseline.value === null) {
    return (
      <div className="empty-state">
        {localBaseline.notice === null ? null : (
          <StorageNotice
            notice={localBaseline.notice}
            onDismiss={localBaseline.dismissNotice}
          />
        )}
        <p className="eyebrow">No active baseline</p>
        <h1>Start with a demo or enter your own monthly values.</h1>
        <div className="action-row">
          <Link className="button button-primary" href="/explore">
            Explore a Demo
          </Link>
          <Link className="button button-secondary" href="/build">
            Build My Scenario
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {localBaseline.notice === null ? null : (
        <StorageNotice
          notice={localBaseline.notice}
          onDismiss={localBaseline.dismissNotice}
        />
      )}
      <ScenarioLab
        baseline={localBaseline.value.baseline}
        heading="Your starting monthly position"
        sourceLabel="Your financial baseline"
        sourceDetail="Stored only in this browser"
        description="These values were restored from this browser. No bank connection or account is required."
        onClear={localBaseline.clear}
        {...(initialScenarioType === undefined
          ? {}
          : { initialType: initialScenarioType })}
      />
    </>
  );
}
