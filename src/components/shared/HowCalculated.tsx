import Link from "next/link";

import {
  METRIC_METHODOLOGY,
  methodologyHref,
  type MetricMethodologyId,
} from "../../data/metric-methodology";

export function HowCalculated({
  metric,
}: Readonly<{ metric: MetricMethodologyId }>) {
  const entry = METRIC_METHODOLOGY[metric];
  return (
    <Link className="how-calculated-link" href={methodologyHref(metric)}>
      How calculated: {entry.name}
    </Link>
  );
}
