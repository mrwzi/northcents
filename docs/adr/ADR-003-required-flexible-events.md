# ADR-003: Required, flexible, and optional events

## Status

Accepted

## Context

A deterministic projection must not silently treat discretionary estimates as guaranteed obligations. It must also avoid moral judgments: “flexible” describes modelling behavior, not whether spending is good or responsible.

## Decision

Applicable expense/planned-transfer source records and normalized events use:

```ts
type Commitment = "required" | "flexible" | "optional";
```

- `required`: included in projections by default.
- `flexible`: excluded unless explicitly scheduled, budgeted, or enabled for the projection.
- `optional`: excluded unless explicitly added to the modeled scenario.

The projection request records which inclusion policy was used. Changing a classification is a user data edit; the engine does not infer it from category alone.

## Consequences

- Housing is not automatically required merely because its category is housing; the source record carries the classification.
- Results can explain which planned events were included or excluded.
- “Where money goes” may aggregate all modeled data while cash-flow results show the active inclusion set.
- Attention rules use only included events and clearly identify required obligations.

## Alternatives considered

- **Include every expected expense:** rejected because flexible estimates would masquerade as scheduled obligations.
- **Infer commitment from category:** rejected because the same category can have different contractual or user-defined status.
- **Use essential/non-essential:** rejected because those labels are judgment-prone and context dependent.

## Future extension path

Future projection presets may include selected flexible budgets, probability ranges, or user-defined policies. The three-value source classification remains factual; extensions must be explicit inputs and cannot silently change defaults.
