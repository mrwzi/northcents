import { DEMO_PROFILES } from "../../data/demo-profiles";
import type { ScenarioType } from "../scenario/ScenarioPicker";
import { ProfileCard } from "./ProfileCard";

export function ProfileList({
  initialScenarioType,
}: Readonly<{ initialScenarioType?: ScenarioType }>) {
  return (
    <div className="profile-grid">
      {DEMO_PROFILES.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          {...(initialScenarioType === undefined
            ? {}
            : { initialScenarioType })}
        />
      ))}
    </div>
  );
}
