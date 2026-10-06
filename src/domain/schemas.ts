import { z } from "zod";

import { MAX_MONTHLY_CENTS, parseCadToCents } from "./money";

const centsSchema = z
  .number()
  .int("Money must be represented as whole cents.")
  .min(0, "Monthly amounts cannot be negative.")
  .max(MAX_MONTHLY_CENTS, "Monthly amounts cannot exceed $1,000,000.00.")
  .refine(Number.isSafeInteger, "Money must use safe integer cents.");

export const baselineSchema = z
  .object({
    incomeCents: centsSchema,
    housingCents: centsSchema,
    otherExpensesCents: centsSchema,
    debtPaymentsCents: centsSchema,
    plannedSavingsCents: centsSchema,
  })
  .strict()
  .readonly();

const moneyInputSchema = z.string().transform((input, context) => {
  const result = parseCadToCents(input);
  if (!result.ok) {
    context.addIssue({ code: "custom", message: result.error.message });
    return z.NEVER;
  }
  return result.value;
});

export const customBaselineInputSchema = z
  .object({
    monthlyTakeHomeIncome: moneyInputSchema,
    housing: moneyInputSchema,
    otherMonthlyExpenses: moneyInputSchema,
    debtPayments: moneyInputSchema,
    plannedSavings: moneyInputSchema,
  })
  .strict()
  .transform((value) => ({
    incomeCents: value.monthlyTakeHomeIncome,
    housingCents: value.housing,
    otherExpensesCents: value.otherMonthlyExpenses,
    debtPaymentsCents: value.debtPayments,
    plannedSavingsCents: value.plannedSavings,
  }));

const percentageSchema = z
  .number()
  .min(-100, "Percentage cannot be below -100%.");
const signedCentsSchema = z.number().int();

export const scenarioSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("housing"),
    mode: z.enum(["absolute", "delta"]),
    value: signedCentsSchema,
  }),
  z.object({
    type: z.literal("income"),
    mode: z.enum(["absolute", "percent"]),
    value: z.number(),
  }),
  z.object({
    type: z.literal("cost-of-living"),
    mode: z.literal("percent"),
    value: percentageSchema,
  }),
  z.object({
    type: z.literal("savings"),
    mode: z.enum(["absolute", "delta"]),
    value: signedCentsSchema,
  }),
]);

export const storedBaselineV1Schema = z
  .object({
    version: z.literal(1),
    savedAt: z.iso.datetime(),
    baseline: baselineSchema,
  })
  .strict();

export const storedBaselineV0Schema = z
  .object({
    version: z.literal(0),
    baseline: baselineSchema,
  })
  .strict();

export type StoredBaselineV1 = z.infer<typeof storedBaselineV1Schema>;
