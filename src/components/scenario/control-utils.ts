import { parseCadToCents } from "../../domain/money";

export type ParsedControlValue =
  | Readonly<{ ok: true; value: number }>
  | Readonly<{ ok: false; message: string }>;

export function parseScenarioMoney(
  input: string,
  signed: boolean,
): ParsedControlValue {
  const trimmed = input.trim();
  const hasSign = trimmed.startsWith("-") || trimmed.startsWith("+");
  const sign = trimmed.startsWith("-") ? -1 : 1;

  if (!signed && sign < 0) {
    return { ok: false, message: "Enter an amount of zero or more." };
  }

  const unsignedInput = hasSign ? trimmed.slice(1).trim() : trimmed;
  const parsed = parseCadToCents(unsignedInput);
  if (!parsed.ok) return { ok: false, message: parsed.error.message };
  return { ok: true, value: parsed.value * sign };
}

export function parseScenarioPercent(input: string): ParsedControlValue {
  const trimmed = input.trim();
  if (!/^[+-]?\d+(?:\.\d{0,2})?$/.test(trimmed)) {
    return {
      ok: false,
      message: "Enter a percentage with up to two decimal places.",
    };
  }

  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, message: "Enter a valid percentage." };
  }
  if (value < -100) {
    return { ok: false, message: "Percentage cannot be below -100%." };
  }
  return { ok: true, value };
}

export function centsInputValue(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const magnitude = Math.abs(cents);
  return `${sign}${String(Math.floor(magnitude / 100))}.${String(magnitude % 100).padStart(2, "0")}`;
}
