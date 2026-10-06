import type { BasisPoints } from "./types";

export const MAX_APR_BASIS_POINTS = 100_000;
const PERCENT_PATTERN = /^(\d+)(?:\.(\d{1,2}))?%?$/;

export function asAprBasisPoints(value: number): BasisPoints {
  if (!Number.isSafeInteger(value))
    throw new RangeError("APR must use integer basis points.");
  if (value < 0 || value > MAX_APR_BASIS_POINTS)
    throw new RangeError("APR is outside the supported range.");
  return value as BasisPoints;
}
export function parseAprPercent(value: string): BasisPoints {
  const match = PERCENT_PATTERN.exec(value.trim());
  if (!match)
    throw new RangeError(
      "APR must be a non-negative percentage with at most two decimals.",
    );
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  return asAprBasisPoints(whole * 100 + fraction);
}
export type ExactRational = Readonly<{
  numerator: bigint;
  denominator: bigint;
}>;
export function aprDailyRate(apr: BasisPoints): ExactRational {
  return { numerator: BigInt(apr), denominator: 10_000n * 365n };
}
