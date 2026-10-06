// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ScenarioLab } from "../../src/components/scenario/ScenarioLab";
import { getDemoProfile } from "../../src/data/demo-profiles";
import type { Baseline } from "../../src/domain/types";

const renter = getDemoProfile("student-renter").baseline;

function renderLab(baseline: Baseline = renter) {
  render(
    <ScenarioLab
      baseline={baseline}
      description="Test baseline"
      heading="Scenario test"
      sourceLabel="Synthetic demo"
    />,
  );
}

function row(label: string) {
  const rowHeader = screen.getByRole("rowheader", { name: label });
  const tableRow = rowHeader.closest("tr");

  if (!tableRow) {
    throw new Error(`Could not find the comparison row for ${label}.`);
  }

  return tableRow;
}

async function replaceInput(label: string, value: string) {
  const user = userEvent.setup();
  const input = screen.getByLabelText(label);
  await user.clear(input);
  if (value.length > 0) await user.type(input, value);
  return user;
}

describe("ScenarioLab", () => {
  it("shows an empty state until a change is entered, then reproduces the housing reference case", async () => {
    renderLab();
    expect(screen.getByText("Try a housing scenario")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await replaceInput("Scenario housing", "1050");

    expect(within(row("Housing")).getByText("$850.00")).toBeInTheDocument();
    expect(within(row("Housing")).getByText("$1,050.00")).toBeInTheDocument();
    expect(within(row("Housing")).getByText("+$200.00")).toBeInTheDocument();
    expect(
      within(row("Housing")).getByText("+$2,400.00 / year"),
    ).toBeInTheDocument();
    expect(within(row("Core surplus")).getByText("$20.00")).toBeInTheDocument();
    expect(
      within(row("Remaining flexible cash")).getByText("−$130.00"),
    ).toBeInTheDocument();
    expect(
      within(row("Housing / income")).getByText("51.5%"),
    ).toBeInTheDocument();
    expect(
      within(row("Housing / income")).getByText("63.6%"),
    ).toBeInTheDocument();
    expect(
      within(row("Housing / income")).getByText("+12.1 percentage points"),
    ).toBeInTheDocument();
    expect(screen.getByText("-90.9% relative change")).toBeInTheDocument();
    expect(
      screen.getByText(
        /remaining flexible cash decreases by \$200.00 per month/i,
      ),
    ).toBeInTheDocument();
  });

  it("supports a housing decrease using signed delta mode", async () => {
    renderLab();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Monthly change" }));
    await replaceInput("Housing difference", "-100");

    expect(within(row("Housing")).getByText("$750.00")).toBeInTheDocument();
    expect(
      within(row("Core surplus")).getByText("$320.00"),
    ).toBeInTheDocument();
    expect(within(row("Housing")).getByText("−$100.00")).toBeInTheDocument();
  });

  it("supports absolute and percentage income increases and decreases", async () => {
    renderLab();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Income/ }));
    await replaceInput("Scenario income", "2000");
    expect(
      within(row("Monthly take-home income")).getByText("$2,000.00"),
    ).toBeInTheDocument();
    expect(
      within(row("Core surplus")).getByText("$570.00"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Percentage change" }));
    await replaceInput("Income percentage change", "-10");
    expect(
      within(row("Monthly take-home income")).getByText("$1,485.00"),
    ).toBeInTheDocument();
    expect(
      within(row("Monthly take-home income")).getByText("−$165.00"),
    ).toBeInTheDocument();
    expect(
      within(row("Monthly take-home income")).getByText("−$1,980.00 / year"),
    ).toBeInTheDocument();
  });

  it("applies cost-of-living changes only to other expenses", async () => {
    renderLab();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Cost of living/ }));
    await replaceInput("Other-expense percentage change", "10");

    expect(
      within(row("Other monthly expenses")).getByText("$638.00"),
    ).toBeInTheDocument();
    expect(within(row("Housing")).getAllByText("$850.00")).toHaveLength(2);
    expect(within(row("Debt payments")).getAllByText("$0.00")).toHaveLength(2);
    expect(within(row("Planned savings")).getAllByText("$150.00")).toHaveLength(
      2,
    );

    await replaceInput("Other-expense percentage change", "-10");
    expect(
      within(row("Other monthly expenses")).getByText("$522.00"),
    ).toBeInTheDocument();
  });

  it("changes savings without describing it as spending or changing core surplus", async () => {
    renderLab();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Planned savings/ }));
    await user.click(screen.getByRole("button", { name: "Monthly change" }));
    await replaceInput("Savings difference", "50");

    expect(
      within(row("Planned savings")).getByText("$200.00"),
    ).toBeInTheDocument();
    expect(within(row("Core surplus")).getAllByText("$220.00")).toHaveLength(2);
    expect(
      within(row("Remaining flexible cash")).getByText("$20.00"),
    ).toBeInTheDocument();
    expect(screen.getByText(/allocation, not an expense/i)).toBeInTheDocument();

    await replaceInput("Savings difference", "-50");
    expect(
      within(row("Planned savings")).getByText("$100.00"),
    ).toBeInTheDocument();
    expect(
      within(row("Remaining flexible cash")).getByText("$120.00"),
    ).toBeInTheDocument();
  });

  it("resets and switches scenario types without mutating its baseline", async () => {
    const snapshot = structuredClone(renter);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderLab();
    const user = userEvent.setup();

    await replaceInput("Scenario housing", "1050");
    await user.click(screen.getByRole("button", { name: "Reset scenario" }));
    expect(screen.getByLabelText("Scenario housing")).toHaveValue("850.00");
    expect(screen.getByText("Try a housing scenario")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await replaceInput("Scenario housing", "1000");
    await user.click(screen.getByRole("button", { name: /^Income/ }));
    expect(screen.getByLabelText("Scenario income")).toHaveValue("1650.00");
    expect(renter).toEqual(snapshot);
  });

  it("treats a deliberately entered zero as a completed no-change scenario", async () => {
    renderLab();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /^Cost of living/ }));
    await replaceInput("Other-expense percentage change", "0");

    expect(
      screen.getByRole("heading", { name: "No change from your baseline." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("explains when planned savings exceed core surplus without rejecting the input", async () => {
    renderLab({
      incomeCents: 100_000,
      housingCents: 50_000,
      otherExpensesCents: 20_000,
      debtPaymentsCents: 0,
      plannedSavingsCents: 500_000,
    });
    await replaceInput("Scenario housing", "500");

    expect(
      screen.getByText(
        "Planned savings exceed core surplus by $4,700.00 per month.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/preserves your entered savings amount/i),
    ).toBeInTheDocument();
  });

  it("preserves zero, deficit, savings-above-surplus, decimal, and large-value states", async () => {
    const edgeBaseline: Baseline = {
      incomeCents: 0,
      housingCents: 100_000_000,
      otherExpensesCents: 25,
      debtPaymentsCents: 0,
      plannedSavingsCents: 50_000,
    };
    renderLab(edgeBaseline);

    expect(screen.getAllByText("N/A").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Infinity|NaN/)).not.toBeInTheDocument();
    expect(screen.getAllByText("−$1,000,000.25").length).toBeGreaterThan(0);
    expect(screen.getAllByText("−$1,000,500.25").length).toBeGreaterThan(0);

    await replaceInput("Scenario housing", "999999.99");
    expect(within(row("Housing")).getByText("$999,999.99")).toBeInTheDocument();
  });

  it("keeps the last valid result during an incomplete edit and reports validation", async () => {
    renderLab();
    await replaceInput("Scenario housing", "1050");
    await replaceInput("Scenario housing", "-");

    expect(screen.getByRole("alert")).toHaveTextContent(
      /zero or more|valid CAD/i,
    );
    expect(within(row("Core surplus")).getByText("$20.00")).toBeInTheDocument();
  });
});
