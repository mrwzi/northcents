import { roundHalfAwayFromZero } from "./money";
import { baselineSchema, scenarioSchema } from "./schemas";
import type { Baseline, Scenario } from "./types";

function applyPercent(cents: number, percent: number): number {
  return roundHalfAwayFromZero(cents * (1 + percent / 100));
}

export function applyScenario(
  input: Baseline,
  inputScenario: Scenario,
): Baseline {
  const baseline = baselineSchema.parse(input);
  const scenario = scenarioSchema.parse(inputScenario);
  let result: Baseline;

  switch (scenario.type) {
    case "housing":
      result = {
        ...baseline,
        housingCents:
          scenario.mode === "absolute"
            ? scenario.value
            : baseline.housingCents + scenario.value,
      };
      break;
    case "income":
      result = {
        ...baseline,
        incomeCents:
          scenario.mode === "absolute"
            ? scenario.value
            : applyPercent(baseline.incomeCents, scenario.value),
      };
      break;
    case "cost-of-living":
      result = {
        ...baseline,
        otherExpensesCents: applyPercent(
          baseline.otherExpensesCents,
          scenario.value,
        ),
      };
      break;
    case "savings":
      result = {
        ...baseline,
        plannedSavingsCents:
          scenario.mode === "absolute"
            ? scenario.value
            : baseline.plannedSavingsCents + scenario.value,
      };
      break;
  }

  return baselineSchema.parse(result);
}
