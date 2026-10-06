# ADR-007: Preserve V1 route compatibility

## Status

Accepted

## Context

V1 has tested direct navigation, query parsing, refresh behavior, methodology anchors, local restoration, and public links. Moving routes during V2 would combine product migration with avoidable compatibility risk.

## Decision

Throughout V2 implementation:

- `/scenario` remains available and becomes the Advanced Analysis experience;
- `/build` remains compatible with the five-field V1 baseline;
- `/explore` retains the four V1 synthetic profiles;
- existing `/methodology` anchors remain valid where reasonably possible;
- `/privacy` remains available and expands additively.

Existing `/scenario?profile=<id>&type=<type>` and `source=user` behavior remains validated. New V2 routes are additive. `/advanced` may link to `/scenario` but does not duplicate its implementation.

## Consequences

- V1 browser tests remain release gates.
- Navigation labels may evolve, but URLs and numerical behavior remain stable.
- V2-to-V1 data passes through an explicit baseline adapter.
- Old bookmarks remain useful during the compatibility period.

## Alternatives considered

- **Move Scenario Lab to `/advanced/scenario`:** rejected because it breaks links without product value.
- **Redirect all V1 routes immediately:** rejected because it obscures migration defects.
- **Fork a second Scenario Lab:** rejected because formulas and fixes would diverge.

## Future extension path

Any retirement or redirect requires a separate accepted ADR, usage/evidence review, redirect tests, storage migration plan, methodology-anchor map, and rollback path.
