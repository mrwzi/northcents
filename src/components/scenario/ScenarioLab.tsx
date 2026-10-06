"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { comparePositions, describeImpact } from "../../domain/comparison";
import { calculatePosition } from "../../domain/finance";
import { applyScenario } from "../../domain/scenarios";
import type { Baseline, Scenario } from "../../domain/types";
import { ComparisonTable } from "../results/ComparisonTable";
import { CalculationDisclosure } from "../results/CalculationDisclosure";
import { ImpactSummary } from "../results/ImpactSummary";
import { BaselineSummary } from "../baseline/BaselineSummary";
import { CostOfLivingControls } from "./CostOfLivingControls";
import { HousingControls } from "./HousingControls";
import { IncomeControls } from "./IncomeControls";
import { SavingsControls } from "./SavingsControls";
import { ScenarioPicker, type ScenarioType } from "./ScenarioPicker";

function initialScenario(type: ScenarioType, baseline: Baseline): Scenario {
  switch (type) {
    case "housing":
      return { type, mode: "absolute", value: baseline.housingCents };
    case "income":
      return { type, mode: "absolute", value: baseline.incomeCents };
    case "cost-of-living":
      return { type, mode: "percent", value: 0 };
    case "savings":
      return { type, mode: "absolute", value: baseline.plannedSavingsCents };
  }
}

function scenarioIsChanged(scenario: Scenario, baseline: Baseline): boolean {
  return (
    JSON.stringify(scenario) !==
    JSON.stringify(initialScenario(scenario.type, baseline))
  );
}

const emptyScenarioCopy: Readonly<
  Record<ScenarioType, Readonly<{ title: string; description: string }>>
> = {
  housing: {
    title: "Try a housing scenario",
    description:
      "Enter a housing change to compare it with your current monthly position.",
  },
  income: {
    title: "Try an income scenario",
    description:
      "Enter an income change to compare it with your current monthly position.",
  },
  "cost-of-living": {
    title: "Try a cost-of-living scenario",
    description:
      "Enter a percentage change to see how other monthly expenses would affect your financial position.",
  },
  savings: {
    title: "Try a planned-savings scenario",
    description:
      "Enter a planned savings change to compare it with your current monthly position.",
  },
};

export function ScenarioLab({
  baseline,
  heading,
  sourceLabel,
  description,
  sourceDetail,
  initialType = "housing",
  onClear,
}: Readonly<{
  baseline: Baseline;
  heading: string;
  sourceLabel: string;
  description: string;
  sourceDetail?: string;
  initialType?: ScenarioType;
  onClear?: () => void;
}>) {
  const [scenario, setScenario] = useState<Scenario>(() =>
    initialScenario(initialType, baseline),
  );
  const [resetRevision, setResetRevision] = useState(0);
  const [hasScenarioInput, setHasScenarioInput] = useState(false);
  const currentPosition = useMemo(
    () => calculatePosition(baseline),
    [baseline],
  );
  const scenarioBaseline = useMemo(
    () => applyScenario(baseline, scenario),
    [baseline, scenario],
  );
  const scenarioPosition = useMemo(
    () => calculatePosition(scenarioBaseline),
    [scenarioBaseline],
  );
  const comparison = useMemo(
    () => comparePositions(currentPosition, scenarioPosition),
    [currentPosition, scenarioPosition],
  );
  const explanation = useMemo(
    () => describeImpact(comparison, scenario),
    [comparison, scenario],
  );

  function changeScenario(
    nextScenario: Scenario,
    userEnteredValue = true,
  ): string | null {
    try {
      applyScenario(baseline, nextScenario);
      setScenario(nextScenario);
      setHasScenarioInput(userEnteredValue);
      return null;
    } catch {
      return "That scenario produces an amount outside the supported monthly range.";
    }
  }

  function selectType(type: ScenarioType) {
    if (type === scenario.type) return;
    if (
      scenarioIsChanged(scenario, baseline) &&
      !window.confirm(
        "Switch scenario type and discard the current scenario adjustment?",
      )
    ) {
      return;
    }
    setScenario(initialScenario(type, baseline));
    setHasScenarioInput(false);
    setResetRevision((revision) => revision + 1);
  }

  function resetScenario() {
    setScenario(initialScenario(scenario.type, baseline));
    setHasScenarioInput(false);
    setResetRevision((revision) => revision + 1);
  }

  return (
    <div className="scenario-lab">
      <header className="scenario-header">
        <div>
          <span className="source-badge">{sourceLabel}</span>
          {sourceDetail === undefined ? null : (
            <span className="source-detail">{sourceDetail}</span>
          )}
          <h1>{heading}</h1>
          <p>{description}</p>
        </div>
        <div className="scenario-header-actions">
          {onClear === undefined ? (
            <Link className="text-link" href="/explore">
              Choose another demo
            </Link>
          ) : (
            <>
              <Link className="text-link" href="/build">
                Edit baseline
              </Link>
              <button
                className="text-button danger-link"
                type="button"
                onClick={onClear}
              >
                Delete local baseline
              </button>
            </>
          )}
        </div>
      </header>

      <details className="baseline-details">
        <summary>View baseline details</summary>
        <BaselineSummary baseline={baseline} />
      </details>

      <ScenarioPicker selected={scenario.type} onSelect={selectType} />

      <div className="scenario-workbench">
        <div key={`${scenario.type}-${String(resetRevision)}`}>
          {scenario.type === "housing" ? (
            <HousingControls baseline={baseline} onChange={changeScenario} />
          ) : null}
          {scenario.type === "income" ? (
            <IncomeControls baseline={baseline} onChange={changeScenario} />
          ) : null}
          {scenario.type === "cost-of-living" ? (
            <CostOfLivingControls onChange={changeScenario} />
          ) : null}
          {scenario.type === "savings" ? (
            <SavingsControls baseline={baseline} onChange={changeScenario} />
          ) : null}
          <button
            className="button button-secondary reset-button"
            type="button"
            onClick={resetScenario}
          >
            Reset scenario
          </button>
        </div>
        {hasScenarioInput ? (
          <ImpactSummary
            comparison={comparison}
            current={currentPosition}
            explanation={explanation}
            scenario={scenarioPosition}
          />
        ) : (
          <section className="scenario-empty" aria-live="polite">
            <p className="eyebrow">Ready when you are</p>
            <h2>{emptyScenarioCopy[scenario.type].title}</h2>
            <p>{emptyScenarioCopy[scenario.type].description}</p>
          </section>
        )}
      </div>

      {hasScenarioInput ? (
        <>
          <ComparisonTable comparison={comparison} />
          <CalculationDisclosure
            current={currentPosition}
            scenario={scenarioPosition}
          />
        </>
      ) : null}
    </div>
  );
}
