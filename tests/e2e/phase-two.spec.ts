import { expect, test } from "@playwright/test";

const fields = {
  income: "Monthly take-home income",
  housing: "Housing",
  other: "Other monthly expenses",
  debt: "Debt payments",
  savings: "Planned savings",
} as const;

async function fillBaseline(
  page: import("@playwright/test").Page,
  values = {
    income: "1650.25",
    housing: "850",
    other: "580",
    debt: "0",
    savings: "150",
  },
) {
  await page.getByLabel(fields.income).fill(values.income);
  await page.getByLabel(fields.housing).fill(values.housing);
  await page.getByLabel(fields.other).fill(values.other);
  await page.getByLabel(fields.debt).fill(values.debt);
  await page.getByLabel(fields.savings).fill(values.savings);
}

test("renders all demos and selects a synthetic profile", async ({ page }) => {
  await page.goto("/explore");
  for (const name of [
    "Student living with family",
    "Student renting near university",
    "Student working part-time",
    "Recent graduate working full-time",
  ]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }

  await page
    .getByRole("article")
    .filter({ hasText: "Student renting near university" })
    .getByRole("link", { name: "Use this profile" })
    .click();
  await expect(page).toHaveURL(/profile=student-renter/);
  await expect(page.getByText("Synthetic demo", { exact: true })).toBeVisible();
  await page.getByText("View baseline details").click();
  await expect(
    page.locator(".baseline-summary").getByText("$1,650.00"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Try a housing scenario" }),
  ).toBeVisible();
});

test("validates, saves, and restores a decimal custom baseline", async ({
  page,
}) => {
  await page.goto("/build");
  await page
    .getByRole("button", { name: "Save baseline and continue" })
    .click();
  await expect(page.getByText("Enter a monthly amount.").first()).toBeVisible();

  await fillBaseline(page);
  await page
    .getByRole("button", { name: "Save baseline and continue" })
    .click();
  await expect(page).toHaveURL(/\/scenario\?source=user/);
  await expect(page.getByText("Your financial baseline")).toBeVisible();
  await page.getByText("View baseline details").click();
  await expect(
    page.locator(".baseline-summary").getByText("$1,650.25"),
  ).toBeVisible();

  await page.goto("/build");
  await expect(page.getByText(/restored from this browser/i)).toBeVisible();
  await expect(page.getByLabel(fields.income)).toHaveValue("$1,650.25");
});

test("shows N/A for zero income and supports manual deletion", async ({
  page,
}) => {
  await page.goto("/build");
  await fillBaseline(page, {
    income: "0",
    housing: "0",
    other: "0",
    debt: "0",
    savings: "0",
  });
  await page
    .getByRole("button", { name: "Save baseline and continue" })
    .click();
  await page.getByText("View baseline details").click();
  await expect(
    page.locator(".baseline-summary").getByText("N/A"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Delete local baseline" }).click();
  await expect(
    page.getByRole("heading", { name: /Start with a demo/i }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("finscope:baseline:v1")),
  ).toBeNull();
});

test("resets malformed local storage and informs the user", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("finscope:baseline:v1", "broken");
  });
  await page.goto("/build");
  await expect(
    page.getByText(/could not be safely restored and was reset/i),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("finscope:baseline:v1")),
  ).toBeNull();
});

test("shows privacy commitments and clear-data controls", async ({ page }) => {
  await page.goto("/privacy");
  await expect(
    page.getByText(/No account or bank connection is required/i),
  ).toBeVisible();
  await expect(page.getByText(/remains in your browser/i)).toBeVisible();
  await expect(page.getByText(/cloud backup is optional/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Clear my data" }),
  ).toBeDisabled();
});

test("supports a keyboard-only baseline flow", async ({ page }) => {
  await page.goto("/build");
  await page.getByLabel(fields.income).focus();
  for (const value of ["1650", "850", "580", "0", "150"]) {
    await page.keyboard.type(value);
    await page.keyboard.press("Tab");
  }
  await expect(
    page.getByRole("button", { name: "Save baseline and continue" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/scenario\?source=user/);
});

test("does not transmit custom financial values", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    requests.push(`${request.url()} ${request.postData() ?? ""}`);
  });

  await page.goto("/build");
  await fillBaseline(page, {
    income: "9123.45",
    housing: "2345.67",
    other: "876.54",
    debt: "321.09",
    savings: "456.78",
  });
  await page
    .getByRole("button", { name: "Save baseline and continue" })
    .click();
  await expect(page).toHaveURL(/\/scenario\?source=user/);

  const transcript = requests.join("\n");
  for (const value of ["9123.45", "2345.67", "876.54", "321.09", "456.78"]) {
    expect(transcript).not.toContain(value);
  }
});
