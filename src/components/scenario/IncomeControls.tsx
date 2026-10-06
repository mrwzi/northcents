"use client";

import { useState } from "react";

import type { Baseline, IncomeScenario } from "../../domain/types";
import {
  centsInputValue,
  parseScenarioMoney,
  parseScenarioPercent,
} from "./control-utils";
import { ModeSelector } from "./ModeSelector";
import { ScenarioValueField } from "./ScenarioValueField";

export function IncomeControls({
  baseline,
  onChange,
}: Readonly<{
  baseline: Baseline;
  onChange: (
    scenario: IncomeScenario,
    userEnteredValue?: boolean,
  ) => string | null;
}>) {
  const [mode, setMode] = useState<IncomeScenario["mode"]>("absolute");
  const [value, setValue] = useState(centsInputValue(baseline.incomeCents));
  const [error, setError] = useState<string | null>(null);

  function selectMode(nextMode: IncomeScenario["mode"]) {
    const nextValue = nextMode === "absolute" ? baseline.incomeCents : 0;
    setMode(nextMode);
    setValue(nextMode === "absolute" ? centsInputValue(nextValue) : "0");
    setError(
      onChange({ type: "income", mode: nextMode, value: nextValue }, false),
    );
  }

  function update(input: string) {
    setValue(input);
    const parsed =
      mode === "absolute"
        ? parseScenarioMoney(input, false)
        : parseScenarioPercent(input);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError(onChange({ type: "income", mode, value: parsed.value }));
  }

  return (
    <div className="control-panel" aria-labelledby="income-controls-heading">
      <div>
        <p className="eyebrow">Income</p>
        <h2 id="income-controls-heading">What if take-home income changes?</h2>
        <p>
          Enter new monthly take-home income or the percentage you expect it to
          increase or decrease by.
        </p>
      </div>
      <ModeSelector
        label="Income input mode"
        mode={mode}
        options={[
          { value: "absolute", label: "New amount" },
          { value: "percent", label: "Percentage change" },
        ]}
        onChange={selectMode}
      />
      <ScenarioValueField
        error={error}
        hint={
          mode === "absolute"
            ? "The modeled monthly take-home income."
            : "Enter a positive percentage for an increase or a negative percentage for a decrease. Minimum: −100%."
        }
        id="income-scenario-value"
        label={
          mode === "absolute" ? "Scenario income" : "Income percentage change"
        }
        unit={mode === "absolute" ? "$" : "%"}
        value={value}
        onChange={update}
      />
    </div>
  );
}
