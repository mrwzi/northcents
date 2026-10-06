"use client";

import { useState } from "react";

import type { Baseline, SavingsScenario } from "../../domain/types";
import { centsInputValue, parseScenarioMoney } from "./control-utils";
import { ModeSelector } from "./ModeSelector";
import { ScenarioValueField } from "./ScenarioValueField";

export function SavingsControls({
  baseline,
  onChange,
}: Readonly<{
  baseline: Baseline;
  onChange: (
    scenario: SavingsScenario,
    userEnteredValue?: boolean,
  ) => string | null;
}>) {
  const [mode, setMode] = useState<SavingsScenario["mode"]>("absolute");
  const [value, setValue] = useState(
    centsInputValue(baseline.plannedSavingsCents),
  );
  const [error, setError] = useState<string | null>(null);

  function selectMode(nextMode: SavingsScenario["mode"]) {
    const nextValue =
      nextMode === "absolute" ? baseline.plannedSavingsCents : 0;
    setMode(nextMode);
    setValue(centsInputValue(nextValue));
    setError(
      onChange({ type: "savings", mode: nextMode, value: nextValue }, false),
    );
  }

  function update(input: string) {
    setValue(input);
    const parsed = parseScenarioMoney(input, mode === "delta");
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError(onChange({ type: "savings", mode, value: parsed.value }));
  }

  return (
    <div className="control-panel" aria-labelledby="savings-controls-heading">
      <div>
        <p className="eyebrow">Planned savings</p>
        <h2 id="savings-controls-heading">What if planned savings changes?</h2>
        <p>
          Planned savings is an allocation, not an expense. Core surplus stays
          separate.
        </p>
      </div>
      <ModeSelector
        label="Savings input mode"
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
            ? "The modeled monthly savings allocation."
            : "Enter a positive amount for an increase or a negative amount for a decrease."
        }
        id="savings-scenario-value"
        label={
          mode === "absolute"
            ? "Scenario planned savings"
            : "Savings difference"
        }
        unit="$"
        value={value}
        onChange={update}
      />
    </div>
  );
}
