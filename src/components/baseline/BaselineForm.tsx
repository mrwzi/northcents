"use client";

import { useRef, useState, type SyntheticEvent } from "react";

import { formatCad } from "../../domain/money";
import { customBaselineInputSchema } from "../../domain/schemas";
import type { Baseline } from "../../domain/types";

type InputName =
  | "monthlyTakeHomeIncome"
  | "housing"
  | "otherMonthlyExpenses"
  | "debtPayments"
  | "plannedSavings";

type FormValues = Record<InputName, string>;
type FormErrors = Partial<Record<InputName, string>>;

const fields: readonly Readonly<{
  name: InputName;
  label: string;
  hint: string;
}>[] = [
  {
    name: "monthlyTakeHomeIncome",
    label: "Monthly take-home income",
    hint: "Income received after tax and deductions.",
  },
  {
    name: "housing",
    label: "Housing",
    hint: "Rent, residence fee, or housing payment.",
  },
  {
    name: "otherMonthlyExpenses",
    label: "Other monthly expenses",
    hint: "Groceries, utilities, transportation, and discretionary spending.",
  },
  {
    name: "debtPayments",
    label: "Debt payments",
    hint: "Required monthly loan or credit payments.",
  },
  {
    name: "plannedSavings",
    label: "Planned savings",
    hint: "An intentional allocation, kept separate from expenses.",
  },
];

const emptyValues: FormValues = {
  monthlyTakeHomeIncome: "",
  housing: "",
  otherMonthlyExpenses: "",
  debtPayments: "",
  plannedSavings: "",
};

function valuesFromBaseline(baseline?: Baseline): FormValues {
  if (baseline === undefined) return emptyValues;
  return {
    monthlyTakeHomeIncome: formatCad(baseline.incomeCents),
    housing: formatCad(baseline.housingCents),
    otherMonthlyExpenses: formatCad(baseline.otherExpensesCents),
    debtPayments: formatCad(baseline.debtPaymentsCents),
    plannedSavings: formatCad(baseline.plannedSavingsCents),
  };
}

export function BaselineForm({
  initialBaseline,
  onValidSubmit,
}: Readonly<{
  initialBaseline?: Baseline;
  onValidSubmit: (baseline: Baseline) => void;
}>) {
  const [values, setValues] = useState<FormValues>(() =>
    valuesFromBaseline(initialBaseline),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const result = customBaselineInputSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          typeof field === "string" &&
          fields.some(({ name }) => name === field)
        ) {
          nextErrors[field as InputName] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      const firstInvalid = fields.find(
        ({ name }) => nextErrors[name] !== undefined,
      )?.name;
      if (firstInvalid !== undefined) {
        (
          formRef.current?.elements.namedItem(
            firstInvalid,
          ) as HTMLInputElement | null
        )?.focus();
      }
      return;
    }

    setErrors({});
    onValidSubmit(result.data);
  }

  return (
    <form
      ref={formRef}
      className="baseline-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="field-grid">
        {fields.map((field) => {
          const error = errors[field.name];
          const hintId = `${field.name}-hint`;
          const errorId = `${field.name}-error`;
          return (
            <div className="field" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <div className="money-input-wrap">
                <span aria-hidden="true">$</span>
                <input
                  aria-describedby={`${hintId}${error === undefined ? "" : ` ${errorId}`}`}
                  aria-invalid={error !== undefined}
                  autoComplete="off"
                  id={field.name}
                  inputMode="decimal"
                  name={field.name}
                  onChange={(event) => {
                    setValues((current) => ({
                      ...current,
                      [field.name]: event.target.value,
                    }));
                    if (errors[field.name] !== undefined) {
                      setErrors((current) => ({
                        ...current,
                        [field.name]: undefined,
                      }));
                    }
                  }}
                  placeholder="0.00"
                  type="text"
                  value={values[field.name]}
                />
                <span aria-hidden="true">CAD</span>
              </div>
              <p className="field-hint" id={hintId}>
                {field.hint}
              </p>
              {error === undefined ? null : (
                <p className="field-error" id={errorId} role="alert">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <button className="button button-primary button-full" type="submit">
        Save baseline and continue
      </button>
    </form>
  );
}
