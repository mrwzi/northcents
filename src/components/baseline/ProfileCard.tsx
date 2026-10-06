import Link from "next/link";

import { formatCad } from "../../domain/money";
import type { DemoProfile } from "../../domain/types";
import { DEMO_PROFILE_CONTEXT } from "../../data/demo-profiles";
import type { ScenarioType } from "../scenario/ScenarioPicker";

export function ProfileCard({
  profile,
  initialScenarioType,
}: Readonly<{ profile: DemoProfile; initialScenarioType?: ScenarioType }>) {
  const scenarioUrl = `/scenario?profile=${profile.id}${
    initialScenarioType === undefined ? "" : `&type=${initialScenarioType}`
  }`;
  return (
    <article className="profile-card">
      <div className="card-topline">
        <span className="source-badge">Synthetic demo</span>
        <span className="profile-id">Example profile</span>
      </div>
      <h2>{profile.name}</h2>
      <p>{profile.description}</p>
      <p className="profile-purpose">
        {DEMO_PROFILE_CONTEXT[profile.id].purpose}
      </p>
      <dl className="profile-facts">
        <div>
          <dt>Monthly take-home income</dt>
          <dd>{formatCad(profile.baseline.incomeCents)}</dd>
        </div>
        <div>
          <dt>Housing</dt>
          <dd>{formatCad(profile.baseline.housingCents)}</dd>
        </div>
        <div>
          <dt>Planned savings</dt>
          <dd>{formatCad(profile.baseline.plannedSavingsCents)}</dd>
        </div>
      </dl>
      <details className="fixture-details">
        <summary>About this synthetic profile</summary>
        <p>{DEMO_PROFILE_CONTEXT[profile.id].construction}</p>
        <p>{profile.provenance} It does not represent a real person.</p>
      </details>
      <Link className="button button-secondary button-full" href={scenarioUrl}>
        Use this profile
      </Link>
    </article>
  );
}
