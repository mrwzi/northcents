import { calculatePosition } from "../../domain/finance";
import { formatCad, formatPercent } from "../../domain/money";
import type { Baseline } from "../../domain/types";

export function BaselineSummary({
  baseline,
}: Readonly<{ baseline: Baseline }>) {
  const position = calculatePosition(baseline);
  return (
    <div className="baseline-summary">
      <dl className="summary-grid">
        <div>
          <dt>Monthly take-home income</dt>
          <dd>{formatCad(position.incomeCents)}</dd>
        </div>
        <div>
          <dt>Non-savings outflows</dt>
          <dd>{formatCad(position.nonSavingsOutflowsCents)}</dd>
        </div>
        <div>
          <dt>Core surplus</dt>
          <dd>{formatCad(position.coreSurplusCents)}</dd>
        </div>
        <div>
          <dt>Planned savings</dt>
          <dd>{formatCad(position.plannedSavingsCents)}</dd>
        </div>
        <div>
          <dt>Remaining flexible cash</dt>
          <dd>{formatCad(position.remainingFlexibleCashCents)}</dd>
        </div>
        <div>
          <dt>Housing / income</dt>
          <dd>{formatPercent(position.housingToIncomeRatio)}</dd>
        </div>
      </dl>
    </div>
  );
}
