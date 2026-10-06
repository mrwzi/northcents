import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const storedBaseline = {
  version: 1,
  savedAt: "2026-01-01T00:00:00.000Z",
  baseline: {
    incomeCents: 300_000,
    housingCents: 120_000,
    otherExpensesCents: 70_000,
    debtPaymentsCents: 20_000,
    plannedSavingsCents: 30_000,
  },
};

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations,
    JSON.stringify(results.violations, null, 2),
  ).toEqual([]);
}

for (const route of [
  "/",
  "/accounts",
  "/plan",
  "/settings",
  "/auth",
  "/explore",
  "/build",
  "/scenario?profile=student-renter",
  "/methodology",
  "/privacy",
] as const) {
  test(`has no automated WCAG A/AA violations on ${route}`, async ({
    page,
  }) => {
    await page.goto(route);
    await expectNoAxeViolations(page);
  });
}

test("has no automated WCAG A/AA violations for a custom baseline", async ({
  page,
}) => {
  await page.addInitScript((record) => {
    localStorage.setItem("finscope:baseline:v1", JSON.stringify(record));
  }, storedBaseline);
  await page.goto("/scenario?source=user");
  await expect(page.getByText("Your financial baseline")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("keeps errors associated with their fields and comparison headers semantic", async ({
  page,
}) => {
  await page.goto("/build");
  await page
    .getByRole("button", { name: "Save baseline and continue" })
    .click();
  const income = page.getByLabel("Monthly take-home income");
  await expect(income).toHaveAttribute("aria-invalid", "true");
  const describedBy = await income.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  const descriptionIds = (describedBy ?? "").split(" ");
  for (const id of descriptionIds)
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  await expect(page.locator("#monthlyTakeHomeIncome-error")).toContainText(
    "Enter a monthly amount.",
  );

  await page.goto("/scenario?profile=student-renter");
  await page.getByLabel("Scenario housing").fill("1050");
  await expect(
    page.getByRole("columnheader", { name: "Metric" }),
  ).toBeVisible();
  await expect(
    page.getByRole("rowheader", { name: "Core surplus" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", {
      name: "Current and scenario financial comparison",
    }),
  ).toHaveAttribute("tabindex", "0");
  await expect(
    page.getByRole("group", { name: "What would you like to change?" }),
  ).toBeVisible();
});
