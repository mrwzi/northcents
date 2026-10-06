"use client";

import { useState } from "react";

import type { Baseline, HousingScenario } from "../../domain/types";
import { centsInputValue, parseScenarioMoney } from "./control-utils";
import { ModeSelector } from "./ModeSelector";
import { ScenarioValueField } from "./ScenarioValueField";

export function HousingControls({
  baseline,
  onChange,
}: Readonly<{
  baseline: Baseline;
  onChange: (
    scenario: HousingScenario,
    userEnteredValue?: boolean,
  ) => string | null;
}>) {
  const [mode, setMode] = useState<HousingScenario["mode"]>("absolute");
  const [value, setValue] = useState(centsInputValue(baseline.housingCents));
  const [error, setError] = useState<string | null>(null);

  function selectMode(nextMode: HousingScenario["mode"]) {
    const nextValue = nextMode === "absolute" ? baseline.housingCents : 0;
    setMode(nextMode);
    setValue(centsInputValue(nextValue));
    setError(
      onChange({ type: "housing", mode: nextMode, value: nextValue }, false),
    );
  }

  function update(input: string) {
    setValue(input);
    const parsed = parseScenarioMoney(input, mode === "delta");
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError(onChange({ type: "housing", mode, value: parsed.value }));
  }

  return (
    <div className="control-panel" aria-labelledby="housing-controls-heading">
      <div>
        <p className="eyebrow">Housing</p>
        <h2 id="housing-controls-heading">What if monthly housing changes?</h2>
        <p>
          Enter a new monthly housing cost or the amount you expect it to
          increase or decrease by.
        </p>
      </div>
      <ModeSelector
        label="Housing input mode"
        mode={mode}
        options={[
          { value: "absolute", label: "New amount" },
          { value: "delta", label: "Monthly change" },
        ]}
        onChange={selectMode}
      />
      <ScenarioValueField
        error={error}
        hint={
          mode === "absolute"
            ? "The modeled monthly housing amount."
            : "Enter a positive amount for an increase or a negative amount for a decrease."
        }
        id="housing-scenario-value"
        label={mode === "absolute" ? "Scenario housing" : "Housing difference"}
        unit="$"
        value={value}
        onChange={update}
      />
    </div>
  );
}
