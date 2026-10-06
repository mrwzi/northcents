import { expect, test } from "@playwright/test";

const storageKey = "finscope:baseline:v1";

async function openRenterScenario(page: import("@playwright/test").Page) {
  await page.goto("/scenario?source=demo&profile=student-renter");
  await expect(
    page.getByRole("heading", { name: "Try a housing scenario" }),
  ).toBeVisible();
}

function comparisonRow(page: import("@playwright/test").Page, label: string) {
  return page
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: label, exact: true }) });
}

test("shows a truthful empty state when no baseline is selected", async ({
  page,
}) => {
  await page.goto("/scenario");
  await expect(
    page.getByRole("heading", {
      name: /Start with a demo or enter your own monthly values/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Explore a demo/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Build my scenario/i }),
  ).toBeVisible();
});

test("reproduces the verified renter housing scenario", async ({ page }) => {
  await openRenterScenario(page);
  await page.getByLabel("Scenario housing").fill("1050");

  await expect(comparisonRow(page, "Housing")).toContainText("$850.00");
  await expect(comparisonRow(page, "Housing")).toContainText("$1,050.00");
  await expect(comparisonRow(page, "Core surplus")).toContainText("$220.00");
  await expect(comparisonRow(page, "Core surplus")).toContainText("$20.00");
  await expect(comparisonRow(page, "Housing / income")).toContainText("51.5%");
  await expect(comparisonRow(page, "Housing / income")).toContainText("63.6%");
  await expect(page.getByText("-90.9% relative change")).toBeVisible();
  await expect(page.getByText("−$2,400.00", { exact: true })).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), storageKey),
  ).toBeNull();
});

test("supports all scenario types and reset without mutating the baseline", async ({
  page,
}) => {
  await openRenterScenario(page);
  await page.getByLabel("Scenario housing").fill("1050");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /^Income/i }).click();
  await page
    .getByRole("button", { name: "Percentage change", exact: true })
    .press("Enter");
  await page.getByLabel("Income percentage change").fill("10");
  await expect(comparisonRow(page, "Monthly take-home income")).toContainText(
    "$1,815.00",
  );

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /^Cost of living/i }).click();
  await page.getByLabel("Other-expense percentage change").fill("10");
  await expect(comparisonRow(page, "Other monthly expenses")).toContainText(
    "$638.00",
  );
  await expect(comparisonRow(page, "Housing")).toContainText("$850.00");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /^Planned savings/i }).click();
  await page.getByRole("button", { name: "Monthly change" }).press("Enter");
  await page.getByLabel("Savings difference").fill("50");
  await expect(comparisonRow(page, "Core surplus")).toContainText("No change");
  await expect(comparisonRow(page, "Remaining flexible cash")).toContainText(
    "−$50.00",
  );

  await page.getByRole("button", { name: "Reset scenario" }).click();
  await expect(page.getByText("Try a planned-savings scenario")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("uses a restored local baseline but keeps scenario experiments transient", async ({
  page,
}) => {
  await page.goto("/build");
  for (const [label, value] of [
    ["Monthly take-home income", "3000.25"],
    ["Housing", "1200.10"],
    ["Other monthly expenses", "700.05"],
    ["Debt payments", "200"],
    ["Planned savings", "300.10"],
  ] as const) {
    await page.getByLabel(label).fill(value);
  }
  await page
    .getByRole("button", { name: "Save baseline and continue" })
    .click();
  const storedBefore = await page.evaluate(
    (key) => localStorage.getItem(key),
    storageKey,
  );

  await expect(page.getByText("Your financial baseline")).toBeVisible();
  await page.getByLabel("Scenario housing").fill("1400.10");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), storageKey),
  ).toBe(storedBefore);

  await page.reload();
  await expect(page.getByLabel("Scenario housing")).toHaveValue("1200.10");
  await expect(page.getByText("Try a housing scenario")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("supports keyboard scenario editing and constrains the mobile viewport", async ({
  page,
}) => {
  await openRenterScenario(page);
  await page.getByLabel("Scenario housing").focus();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("1050");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Reset scenario" }),
  ).toBeFocused();
  await expect(page.getByText("−$2,400.00", { exact: true })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test("does not transmit local baseline or scenario values", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    requests.push(`${request.url()} ${request.postData() ?? ""}`);
  });

  await page.goto("/build");
  for (const [label, value] of [
    ["Monthly take-home income", "9123.45"],
    ["Housing", "2345.67"],
    ["Other monthly expenses", "876.54"],
    ["Debt payments", "321.09"],
    ["Planned savings", "456.78"],
  ] as const) {
    await page.getByLabel(label).fill(value);
  }
  await page
    .getByRole("button", { name: "Save baseline and continue" })
    .click();
  await page.getByLabel("Scenario housing").fill("3456.78");
  await expect(comparisonRow(page, "Housing")).toContainText("$3,456.78");

  const transcript = requests.join("\n");
  for (const value of [
    "9123.45",
    "2345.67",
    "876.54",
    "321.09",
    "456.78",
    "3456.78",
  ]) {
    expect(transcript).not.toContain(value);
  }
});
