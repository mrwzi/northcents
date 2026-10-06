import { formatCad } from "../../domain/money";
import type { CalculatedPosition } from "../../domain/types";
import { HowCalculated } from "../shared/HowCalculated";

export function CalculationDisclosure({
  current,
  scenario,
}: Readonly<{
  current: CalculatedPosition;
  scenario: CalculatedPosition;
}>) {
  return (
    <details className="calculation-disclosure">
      <summary>View calculation details</summary>
      <div className="calculation-detail-grid">
        <section aria-labelledby="scenario-core-calculation">
          <h3 id="scenario-core-calculation">Scenario core surplus</h3>
          <p className="calculation-line">
            {formatCad(scenario.incomeCents)} income −{" "}
            {formatCad(scenario.housingCents)} housing −{" "}
            {formatCad(scenario.otherExpensesCents)} other monthly expenses −{" "}
            {formatCad(scenario.debtPaymentsCents)} debt payments ={" "}
            <strong>{formatCad(scenario.coreSurplusCents)} core surplus</strong>
          </p>
          <HowCalculated metric="core-surplus" />
        </section>
        <section aria-labelledby="scenario-flexible-calculation">
          <h3 id="scenario-flexible-calculation">
            Scenario remaining flexible cash
          </h3>
          <p className="calculation-line">
            {formatCad(scenario.coreSurplusCents)} core surplus −{" "}
            {formatCad(scenario.plannedSavingsCents)} planned savings ={" "}
            <strong>
              {formatCad(scenario.remainingFlexibleCashCents)} remaining
              flexible cash
            </strong>
          </p>
          <HowCalculated metric="remaining-flexible-cash" />
        </section>
      </div>
      <p className="calculation-current-note">
        Current core surplus is {formatCad(current.coreSurplusCents)} and
        current remaining flexible cash is{" "}
        {formatCad(current.remainingFlexibleCashCents)}.
      </p>
    </details>
  );
}
