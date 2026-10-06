import type { Cents, Ratio } from "./types";

export const MAX_MONTHLY_CENTS = 100_000_000;

export type MoneyParseErrorCode =
  "empty" | "invalid-format" | "negative" | "too-precise" | "too-large";

export type MoneyParseError = Readonly<{
  code: MoneyParseErrorCode;
  message: string;
}>;

export type Result<T, E> =
  Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; error: E }>;

const CAD_PATTERN = /^(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?$/;

export function parseCadToCents(input: string): Result<Cents, MoneyParseError> {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return failure("empty", "Enter a monthly amount.");
  }

  if (trimmed.startsWith("-")) {
    return failure("negative", "Monthly amounts cannot be negative.");
  }

  const normalizedCurrency = trimmed.startsWith("$")
    ? trimmed.slice(1).trim()
    : trimmed;
  const decimalPart = normalizedCurrency.split(".")[1];
  if (decimalPart !== undefined && decimalPart.length > 2) {
    return failure("too-precise", "Use no more than two decimal places.");
  }

  const match = CAD_PATTERN.exec(normalizedCurrency);
  if (match === null) {
    return failure("invalid-format", "Enter a valid CAD amount.");
  }

  const [wholePart = "0", fractionPart = ""] = normalizedCurrency
    .replaceAll(",", "")
    .split(".");
  const cents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_MONTHLY_CENTS) {
    return failure("too-large", "Monthly amounts cannot exceed $1,000,000.00.");
  }

  return { ok: true, value: cents };
}

function failure(
  code: MoneyParseErrorCode,
  message: string,
): Result<never, MoneyParseError> {
  return { ok: false, error: { code, message } };
}

const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCad(cents: Cents): string {
  assertSafeCents(cents);
  const normalizedCents = Object.is(cents, -0) ? 0 : cents;
  return cadFormatter.format(normalizedCents / 100).replace(/^-/, "−");
}

export function formatSignedCad(cents: Cents): string {
  if (cents > 0) return `+${formatCad(cents)}`;
  return formatCad(cents);
}

export function formatPercent(ratio: Ratio): string {
  if (ratio === null) return "N/A";
  return `${(ratio * 100).toFixed(1)}%`;
}

export function roundHalfAwayFromZero(value: number): number {
  if (!Number.isFinite(value))
    throw new RangeError("Cannot round a non-finite value.");
  const roundedMagnitude = Math.floor(Math.abs(value) + 0.5 + Number.EPSILON);
  return Math.sign(value) * roundedMagnitude;
}

export function assertSafeCents(value: number): asserts value is Cents {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Money values must be safe integer cents.");
  }
}
