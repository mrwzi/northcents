import { formatCad, formatPercent, formatSignedCad } from "../../domain/money";
import type { MetricDifference, PositionComparison } from "../../domain/types";
import { METRIC_METHODOLOGY } from "../../data/metric-methodology";
import { HowCalculated } from "../shared/HowCalculated";

type MoneyKey =
  | "income"
  | "housing"
  | "otherExpenses"
  | "debtPayments"
  | "plannedSavings"
  | "coreSurplus"
  | "remainingFlexibleCash";
type RatioKey = "housingToIncomeRatio" | "savingsRate" | "expenseToIncomeRatio";

const rows: readonly (
  | Readonly<{ key: MoneyKey; label: string; kind: "money" }>
  | Readonly<{ key: RatioKey; label: string; kind: "ratio" }>
)[] = [
  { key: "income", label: METRIC_METHODOLOGY.income.name, kind: "money" },
  { key: "housing", label: METRIC_METHODOLOGY.housing.name, kind: "money" },
  {
    key: "otherExpenses",
    label: METRIC_METHODOLOGY["other-expenses"].name,
    kind: "money",
  },
  {
    key: "debtPayments",
    label: METRIC_METHODOLOGY["debt-payments"].name,
    kind: "money",
  },
  {
    key: "plannedSavings",
    label: METRIC_METHODOLOGY["planned-savings"].name,
    kind: "money",
  },
  {
    key: "coreSurplus",
    label: METRIC_METHODOLOGY["core-surplus"].name,
    kind: "money",
  },
  {
    key: "remainingFlexibleCash",
    label: METRIC_METHODOLOGY["remaining-flexible-cash"].name,
    kind: "money",
  },
  {
    key: "housingToIncomeRatio",
    label: METRIC_METHODOLOGY["housing-to-income"].name,
    kind: "ratio",
  },
  {
    key: "savingsRate",
    label: METRIC_METHODOLOGY["savings-rate"].name,
    kind: "ratio",
  },
  {
    key: "expenseToIncomeRatio",
    label: METRIC_METHODOLOGY["expense-to-income"].name,
    kind: "ratio",
  },
];

function ratioDelta(metric: MetricDifference): string {
  if (metric.delta === null) return "N/A";
  if (metric.delta === 0) return "No change";
  const points = metric.delta * 100;
  return `${points > 0 ? "+" : "−"}${Math.abs(points).toFixed(1)} percentage points`;
}

export function ComparisonTable({
  comparison,
}: Readonly<{ comparison: PositionComparison }>) {
  return (
    <section
      className="comparison-section"
      aria-labelledby="comparison-heading"
    >
      <div className="section-heading compact-heading">
        <p className="eyebrow">Current vs scenario</p>
        <h2 id="comparison-heading">Full comparison</h2>
        <p>
          Monetary changes show their monthly difference and annualized effect.
        </p>
        <HowCalculated metric="percentage-point-change" />
      </div>
      <div
        aria-label="Current and scenario financial comparison"
        className="comparison-table-wrap"
        role="region"
        tabIndex={0}
      >
        <table className="comparison-table">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Current</th>
              <th scope="col">Scenario</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const metric = comparison[row.key];
              const delta = metric.delta;
              return (
                <tr key={row.key} data-changed={delta !== null && delta !== 0}>
                  <th scope="row">{row.label}</th>
                  <td>
                    {row.kind === "money"
                      ? formatCad(metric.current ?? 0)
                      : formatPercent(metric.current)}
                  </td>
                  <td>
                    {row.kind === "money"
                      ? formatCad(metric.scenario ?? 0)
                      : formatPercent(metric.scenario)}
                  </td>
                  <td
                    data-direction={
                      delta === null || delta === 0
                        ? "neutral"
                        : delta > 0
                          ? "positive"
                          : "negative"
                    }
                  >
                    {row.kind === "money" ? (
                      <>
                        <strong>
                          {delta === 0
                            ? "No change"
                            : formatSignedCad(delta ?? 0)}
                        </strong>
                        {delta === 0 ? null : (
                          <small>
                            {formatSignedCad(metric.annualDelta ?? 0)} / year
                          </small>
                        )}
                      </>
                    ) : (
                      <strong>{ratioDelta(metric)}</strong>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
