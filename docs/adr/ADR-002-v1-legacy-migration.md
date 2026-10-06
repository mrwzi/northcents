# ADR-002: Preserve V1 baseline as a legacy snapshot

## Status

Accepted

## Context

V1 stores a validated monthly baseline at `finscope:baseline:v1`: income, housing, other expenses, debt payments, planned savings, and `savedAt`. It contains no event dates, schedules, categories, debt balances, rates, goals, or account structure. Those missing facts cannot be reconstructed safely.

## Decision

V2 migration reads the V1 record only through the existing storage loader and preserves valid data as a versioned `LegacyMonthlyBaselineSnapshot`. The snapshot retains the five cent values, original save timestamp, migration timestamp, source, and `completeness: "monthly-aggregate-only"`.

Migration never invents dates, pay schedules, categories, recurrence, debt balances, APRs, debt due dates, goals, or accounts. The user progressively adds V2 data. The original V1 localStorage record remains throughout the compatibility period so `/build` and `/scenario` continue to work.

## Consequences

- A migrated user retains their values immediately but cannot receive a dated cash-flow projection until dated inputs are added.
- Migration is additive, previewable, atomic, journaled, and idempotent.
- `savedAt` is provenance, not a financial as-of date.
- Malformed/unsupported V1 data continues to follow the existing reset contract rather than heuristic repair.

## Alternatives considered

- **Infer dates/categories from monthly fields:** rejected because it fabricates financial facts.
- **Delete V1 after copying:** rejected because it breaks route compatibility and rollback.
- **Leave V1 isolated forever:** rejected because progressive enrichment should be possible.

## Future extension path

After a compatibility release and explicit product decision, users may remove the legacy copy once export, V2-to-V1 derivation, rollback, and direct `/scenario` behavior are proven. The snapshot format remains importable even after the old key is retired.
