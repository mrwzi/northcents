# ADR-010: Four synthetic V2 personas

## Status

Accepted

## Context

V2 needs immediate, privacy-free demonstrations of dated cash flow, irregular income, debt, goals, and periodic expenses. V1’s four monthly profiles remain valid Advanced Analysis fixtures but do not cover the richer V2 entities.

## Decision

Create four separate V2 fixture contracts; Phase 1 does not assign final amounts:

1. **Student renter:** housing, part-time income, recurring expenses, tuition/periodic cost, and savings.
2. **Irregular-income worker:** multiple income events, variable timing, history supporting low/median/average planning, and a timing pressure point.
3. **Recent graduate with debt:** rent, income, required debt payment, an APR-estimate debt model, and debt-payment scenarios.
4. **Young worker with periodic expenses and goals:** stable income, annual/periodic expenses, sinking funds, emergency savings, and goal planning.

Every fixture uses `ownerSource: "synthetic-demo"`, states that it represents no real person and is not a statistical average, and records the features it is designed to exercise. No fixture implies University of Waterloo affiliation or a Canadian “typical” amount.

## Consequences

- V2 demos are distinct from V1 fixture numbers and from user workspaces.
- Final values require audited invariant tables and golden calculations in a later phase.
- Personas are product-test fixtures, not benchmark/reference data.
- Selecting a demo cannot overwrite My Money.

## Alternatives considered

- **Reuse only V1 personas:** rejected because monthly aggregates cannot demonstrate dated V2 behavior.
- **Use anonymized real users:** rejected because provenance/privacy would be harder to guarantee.
- **Call fixtures representative averages:** rejected because no statistical basis is intended.

## Future extension path

Later phases choose amounts/dates specifically to cover recurrence, shortfall, debt, and goal tests. Additional personas require a documented feature gap and the same provenance contract; marketing localization must not change synthetic fixtures into demographic claims.
