import type { Scenario } from "../../domain/types";

export type ScenarioType = Scenario["type"];

export const SCENARIO_OPTIONS: readonly Readonly<{
  type: ScenarioType;
  label: string;
  shortLabel: string;
  description: string;
}>[] = [
  {
    type: "housing",
    label: "Housing",
    shortLabel: "Housing",
    description: "Model a different monthly housing cost.",
  },
  {
    type: "income",
    label: "Income",
    shortLabel: "Income",
    description: "Change take-home income by amount or percentage.",
  },
  {
    type: "cost-of-living",
    label: "Cost of living",
    shortLabel: "Cost of living",
    description: "Model a percentage change in other monthly expenses.",
  },
  {
    type: "savings",
    label: "Planned savings",
    shortLabel: "Savings",
    description: "Change your monthly planned savings amount.",
  },
] as const;

export function ScenarioPicker({
  selected,
  onSelect,
}: Readonly<{
  selected: ScenarioType;
  onSelect: (type: ScenarioType) => void;
}>) {
  return (
    <fieldset className="scenario-picker">
      <legend>What would you like to change?</legend>
      <div className="scenario-option-grid">
        {SCENARIO_OPTIONS.map((option) => (
          <button
            aria-pressed={selected === option.type}
            className="scenario-option"
            key={option.type}
            type="button"
            onClick={() => {
              onSelect(option.type);
            }}
          >
            <span>{option.label}</span>
            <small>{option.description}</small>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
