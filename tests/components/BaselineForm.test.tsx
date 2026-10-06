// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BaselineForm } from "../../src/components/baseline/BaselineForm";

async function fillForm(values: readonly string[]) {
  const user = userEvent.setup();
  const inputs = [
    screen.getByLabelText("Monthly take-home income"),
    screen.getByLabelText("Housing"),
    screen.getByLabelText("Other monthly expenses"),
    screen.getByLabelText("Debt payments"),
    screen.getByLabelText("Planned savings"),
  ];
  for (const [index, input] of inputs.entries()) {
    const value = values[index] ?? "";
    if (value.length > 0) await user.type(input, value);
  }
  return user;
}

describe("BaselineForm", () => {
  it("submits the five fields through the existing cents validation contract", async () => {
    const onValidSubmit = vi.fn();
    render(<BaselineForm onValidSubmit={onValidSubmit} />);
    const user = await fillForm(["1650", "850", "580", "0", "150"]);

    await user.click(
      screen.getByRole("button", { name: "Save baseline and continue" }),
    );

    expect(onValidSubmit).toHaveBeenCalledWith({
      incomeCents: 165_000,
      housingCents: 85_000,
      otherExpensesCents: 58_000,
      debtPaymentsCents: 0,
      plannedSavingsCents: 15_000,
    });
  });

  it("accepts decimal currency without exposing cents", async () => {
    const onValidSubmit = vi.fn();
    render(<BaselineForm onValidSubmit={onValidSubmit} />);
    const user = await fillForm([
      "$1,650.25",
      "850.10",
      "580.09",
      "0.01",
      "150.55",
    ]);
    await user.click(
      screen.getByRole("button", { name: "Save baseline and continue" }),
    );

    expect(onValidSubmit).toHaveBeenCalledWith({
      incomeCents: 165_025,
      housingCents: 85_010,
      otherExpensesCents: 58_009,
      debtPaymentsCents: 1,
      plannedSavingsCents: 15_055,
    });
  });

  it("accepts zero income and zero expenses", async () => {
    const onValidSubmit = vi.fn();
    render(<BaselineForm onValidSubmit={onValidSubmit} />);
    const user = await fillForm(["0", "0", "0", "0", "0"]);
    await user.click(
      screen.getByRole("button", { name: "Save baseline and continue" }),
    );
    expect(onValidSubmit).toHaveBeenCalledOnce();
  });

  it("shows validation errors, rejects negatives, and focuses the first invalid field", async () => {
    const onValidSubmit = vi.fn();
    render(<BaselineForm onValidSubmit={onValidSubmit} />);
    const user = await fillForm(["-1", "", "10.001", "abc", "0"]);
    await user.click(
      screen.getByRole("button", { name: "Save baseline and continue" }),
    );

    expect(onValidSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Monthly take-home income")).toHaveFocus();
    expect(
      screen.getByText("Monthly amounts cannot be negative."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Use no more than two decimal places."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(4);
  });

  it("has a logical keyboard order through every field and submit action", async () => {
    const user = userEvent.setup();
    render(<BaselineForm onValidSubmit={vi.fn()} />);

    for (const name of [
      "Monthly take-home income",
      "Housing",
      "Other monthly expenses",
      "Debt payments",
      "Planned savings",
      "Save baseline and continue",
    ]) {
      await user.tab();
      expect(
        screen.getByRole(
          name === "Save baseline and continue" ? "button" : "textbox",
          { name },
        ),
      ).toHaveFocus();
    }
  });
});
