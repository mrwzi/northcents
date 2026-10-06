# ADR-004: Same-day event timing uncertainty

## Status

Accepted

## Context

Most financial inputs provide a due/expected date but not a reliable posting time. If income and rent share October 1, assuming one always posts first can create a false claim about intraday liquidity.

## Decision

Projection groups events by canonical `LocalDate`. It calculates an order-independent end-of-day balance:

```text
closing = opening + all included inflows − all included outflows
```

It also calculates the possible same-day liquidity interval:

```text
lowerBound = opening − all included outflows
upperBound = opening + all included inflows
```

No hidden event priority is assigned within the date. When `lowerBound < 0` and same-day inflows could change availability, the result includes a `SameDayTimingUncertainty` carrying date, opening balance, total inflows, total outflows, lower bound, closing balance, and related event IDs. Copy may say: “Transaction timing on October 1 may affect the available balance during the day.”

A projected shortfall based on negative end-of-day closing is distinct from timing uncertainty.

## Consequences

- Same-date event order cannot be displayed as a precise running ledger.
- A day may have both a non-negative closing balance and a timing uncertainty.
- Lowest closing balance and lowest possible intraday balance are separate metrics.
- Tests must prove input ordering does not change daily results.

## Alternatives considered

- **Income first:** rejected as an unsupported optimistic assumption.
- **Expenses first:** rejected as an unsupported pessimistic posting claim, although its bound remains useful.
- **Discard same-day information:** rejected because temporary liquidity can matter.

## Future extension path

A later event contract may add explicit, user-entered posting windows or confirmed timestamps. Only events with that evidence may be ordered; date-only events continue using the uncertainty contract.
