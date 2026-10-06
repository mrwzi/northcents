import type { Metadata } from "next";

import { ActiveBaseline } from "../../components/baseline/ActiveBaseline";
import type { ScenarioType } from "../../components/scenario/ScenarioPicker";
import { DEMO_PROFILE_IDS, type DemoProfileId } from "../../domain/types";

export const metadata: Metadata = { title: "Active baseline" };

type ScenarioPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function parseProfileId(
  value: string | string[] | undefined,
): DemoProfileId | null | "invalid" {
  if (value === undefined) return null;
  if (typeof value !== "string") return "invalid";
  return DEMO_PROFILE_IDS.includes(value as DemoProfileId)
    ? (value as DemoProfileId)
    : "invalid";
}

const scenarioTypes: readonly ScenarioType[] = [
  "housing",
  "income",
  "cost-of-living",
  "savings",
];

function parseScenarioType(
  value: string | string[] | undefined,
): ScenarioType | undefined {
  if (typeof value !== "string") return undefined;
  return scenarioTypes.includes(value as ScenarioType)
    ? (value as ScenarioType)
    : undefined;
}

export default async function ScenarioPage({
  searchParams,
}: ScenarioPageProps) {
  const parameters = await searchParams;
  const profileId = parseProfileId(parameters.profile);
  const initialScenarioType = parseScenarioType(parameters.type);

  return (
    <section className="section shell form-shell">
      <ActiveBaseline
        profileId={profileId}
        {...(initialScenarioType === undefined ? {} : { initialScenarioType })}
      />
    </section>
  );
}
