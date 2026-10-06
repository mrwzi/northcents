import { roundHalfAwayFromZero } from "../../domain/money";
import type { V2Cents } from "./types";

export const MAX_V2_CENTS = 10_000_000_000;

export function asV2Cents(value: number): V2Cents {
  if (!Number.isSafeInteger(value))
    throw new RangeError("Money must be safe integer cents.");
  if (Math.abs(value) > MAX_V2_CENTS)
    throw new RangeError("Money exceeds the V2 limit.");
  return value as V2Cents;
}
export function asNonNegativeV2Cents(value: number): V2Cents {
  const cents = asV2Cents(value);
  if (cents < 0) throw new RangeError("Money must be non-negative.");
  return cents;
}
export function addCents(a: V2Cents, b: V2Cents): V2Cents {
  return asV2Cents(a + b);
}
export function subtractCents(a: V2Cents, b: V2Cents): V2Cents {
  return asV2Cents(a - b);
}
export function roundToV2Cents(value: number): V2Cents {
  return asV2Cents(roundHalfAwayFromZero(value));
}
export function allocateCents(
  total: V2Cents,
  count: number,
): readonly V2Cents[] {
  if (total < 0) throw new RangeError("Allocation total must be non-negative.");
  if (!Number.isSafeInteger(count) || count <= 0)
    throw new RangeError("Allocation count must be positive.");
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({ length: count }, (_, index) =>
    asV2Cents(base + (index < remainder ? 1 : 0)),
  );
}
export function serializeCents(value: V2Cents): number {
  return value;
}

export type V2MoneyInputResult =
  | Readonly<{ ok: true; cents: V2Cents }>
  | Readonly<{ ok: false; message: string }>;

/** Parse user-entered CAD without using floating-point arithmetic. */
export function parseV2CadInput(
  input: string,
  options: Readonly<{ allowNegative?: boolean }> = {},
): V2MoneyInputResult {
  const normalized = input.trim().replace(/^\$/, "").replaceAll(",", "");
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized))
    return {
      ok: false,
      message: "Enter a CAD amount with up to two decimals.",
    };
  const negative = normalized.startsWith("-");
  if (negative && !options.allowNegative)
    return { ok: false, message: "Enter zero or a positive amount." };
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, fraction = ""] = unsigned.split(".");
  const magnitude = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  const value = negative ? -magnitude : magnitude;
  if (!Number.isSafeInteger(value) || Math.abs(value) > MAX_V2_CENTS)
    return { ok: false, message: "Amount is outside the supported range." };
  return { ok: true, cents: asV2Cents(value) };
}
