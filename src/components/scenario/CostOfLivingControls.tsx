"use client";

import { useState } from "react";

import type { CostOfLivingScenario } from "../../domain/types";
import { parseScenarioPercent } from "./control-utils";
import { ScenarioValueField } from "./ScenarioValueField";

export function CostOfLivingControls({
  onChange,
}: Readonly<{ onChange: (scenario: CostOfLivingScenario) => string | null }>) {
  const [value, setValue] = useState("0");
  const [error, setError] = useState<string | null>(null);

  function update(input: string) {
    setValue(input);
    const parsed = parseScenarioPercent(input);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError(
      onChange({
        type: "cost-of-living",
        mode: "percent",
        value: parsed.value,
      }),
    );
  }

  return (
    <div className="control-panel" aria-labelledby="cost-controls-heading">
      <div>
        <p className="eyebrow">Cost of living</p>
        <h2 id="cost-controls-heading">What if everyday costs change?</h2>
        <p>
          This percentage applies only to other monthly expenses. Housing, debt
          payments, and planned savings remain unchanged.
        </p>
      </div>
      <ScenarioValueField
        error={error}
        hint="Enter a positive percentage for an increase or a negative percentage for a decrease. Minimum: −100%."
        id="cost-scenario-value"
        label="Other-expense percentage change"
        unit="%"
        value={value}
        onChange={update}
      />
    </div>
  );
}
