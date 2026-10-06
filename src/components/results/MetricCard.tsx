import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  detail,
  direction = "neutral",
  featured = false,
}: Readonly<{
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  direction?: "positive" | "negative" | "neutral";
  featured?: boolean;
}>) {
  return (
    <div
      className="impact-metric"
      data-direction={direction}
      data-featured={featured}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      {detail === undefined ? null : <small>{detail}</small>}
    </div>
  );
}
