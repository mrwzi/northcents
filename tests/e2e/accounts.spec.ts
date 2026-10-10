import { expect, test } from "@playwright/test";

test("adds manual assets and liabilities and derives the home totals", async ({
  page,
}) => {
  await page.goto("/accounts");
  await page.getByRole("button", { name: "+ Add" }).click();
  await expect(page.getByLabel("Account nickname")).toBeHidden();
  await page.getByLabel("Name of bank or platform").fill("Example Bank");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Name of bank or platform")).toBeHidden();
  await page.getByText("Add a nickname (optional)").click();
  await page.getByLabel("Account nickname").fill("Everyday chequing");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Current value").fill("1420.25");
  await page.getByRole("button", { name: "Save account" }).click();
  await expect(page.getByText("Account saved locally.")).toBeVisible();
  await expect(page.getByText("$1,420.25").first()).toBeVisible();

  await page.getByRole("button", { name: "+ Account" }).click();
  await page.getByRole("button", { name: "Money I owe" }).click();
  await page
    .getByLabel("Account type", { exact: true })
    .selectOption("credit-card");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Current amount owed").fill("420.25");
  await page.getByLabel("Required monthly payment").fill("35.00");
  await page.getByRole("button", { name: "Save account" }).click();
  await expect(page.getByText("−$420.25")).toHaveCount(0);
  await expect(page.getByText("$420.25").first()).toBeVisible();
  await expect(page.getByText("$35.00 / month")).toBeVisible();

  await page.goto("/");
  await expect(page.getByText("Your financial picture")).toBeVisible();
  await expect(page.getByText("$1,000.00")).toBeVisible();
  await expect(page.getByText("$1,420.25").first()).toBeVisible();
  await expect(page.getByText("$420.25").first()).toBeVisible();
});

test("keeps investments out of spendable cash", async ({ page }) => {
  await page.goto("/accounts");
  await page.getByRole("button", { name: "+ Add" }).click();
  await page.getByLabel("Place type").selectOption("investment-platform");
  await page.getByLabel("Name of bank or platform").fill("Investment platform");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Account type", { exact: true }).selectOption("tfsa");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Current value").fill("5000");
  await page.getByLabel("Available to spend?").selectOption("non-cash");
  await page.getByRole("button", { name: "Save account" }).click();
  await expect(page.getByText("$5,000.00").first()).toBeVisible();
  await expect(page.getByText("$0.00").first()).toBeVisible();
});

test("adds cash without asking for a place or account name", async ({
  page,
}) => {
  await page.goto("/accounts");
  await page.getByRole("button", { name: "+ Add" }).click();
  await page.getByLabel("Place type").selectOption("cash");

  await expect(page.getByLabel("Name of bank or platform")).toHaveCount(0);
  await expect(
    page.getByText("No name needed. Cash will appear as its own place."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByLabel("Current value")).toBeVisible();
  await expect(page.getByLabel("Account type", { exact: true })).toHaveCount(0);

  await page.getByLabel("Current value").fill("60.50");
  await page.getByRole("button", { name: "Save account" }).click();

  await expect(page.getByText("Account saved locally.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cash" })).toBeVisible();
  await expect(page.getByText("$60.50").first()).toBeVisible();
});

test("adds a flexible debt without inventing a monthly payment", async ({
  page,
}) => {
  await page.goto("/accounts");
  await page.getByRole("button", { name: "+ Add" }).click();
  await page.getByLabel("Place type").selectOption("other");
  await page.getByLabel("Name of bank or platform").fill("Student loans");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Money I owe" }).click();
  await page
    .getByLabel("Account type", { exact: true })
    .selectOption("student-loan");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Current amount owed").fill("3000");
  await page.getByLabel("Payment schedule").selectOption("flexible");

  await expect(page.getByLabel("Required monthly payment")).toHaveCount(0);
  await expect(
    page.getByText("You choose when and how much to pay."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Save account" }).click();
  await expect(page.getByText("No fixed monthly payment")).toBeVisible();
  await expect(page.getByText("Monthly payment missing")).toHaveCount(0);
});

test("saves a paid-off credit card without inventing debt or a payment", async ({
  page,
}) => {
  await page.goto("/accounts");
  await page.getByRole("button", { name: "+ Add" }).click();
  await page.getByLabel("Name of bank or platform").fill("Example Bank");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Money I owe" }).click();
  await page
    .getByLabel("Account type", { exact: true })
    .selectOption("credit-card");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Current amount owed").fill("0");

  await expect(page.getByLabel("Required monthly payment")).toHaveCount(0);
  await expect(page.getByText("Nothing is due while")).toBeVisible();
  await expect(page.getByText("Your credit limit is not money")).toBeVisible();

  await page.getByRole("button", { name: "Save account" }).click();
  await expect(page.getByText("Account saved locally.")).toBeVisible();
  await expect(page.getByText("No balance owed")).toBeVisible();
});

test("records money in and money out against an existing account", async ({
  page,
}) => {
  await page.goto("/accounts");
  await page.getByRole("button", { name: "+ Add" }).click();
  await page.getByLabel("Name of bank or platform").fill("Daily bank");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Current value").fill("100");
  await page.getByRole("button", { name: "Save account" }).click();

  await page.getByRole("button", { name: "Money in" }).click();
  await page.getByLabel("Where did it come from?").selectOption("Gift");
  await page.getByLabel("Amount").fill("50.25");
  await page.getByRole("button", { name: "Add money", exact: true }).click();
  await expect(page.getByText("$50.25 added to Chequing.")).toBeVisible();
  await expect(page.getByText("$150.25").first()).toBeVisible();

  await page.getByRole("button", { name: "Money out" }).click();
  await page.getByLabel("What was it for?").selectOption("groceries");
  await page.getByLabel("Amount").fill("20.25");
  await page.getByRole("button", { name: "Save spending" }).click();
  await expect(
    page.getByText("$20.25 spending recorded from Chequing."),
  ).toBeVisible();
  await expect(page.getByText("$130.00").first()).toBeVisible();
});

test("account form is usable without a pointer", async ({ page }) => {
  await page.goto("/accounts");
  const add = page.getByRole("button", { name: "+ Add" });
  await add.focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Name of bank or platform").focus();
  await page.keyboard.type("Wallet");
  await page.getByRole("button", { name: "Continue" }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Account type", { exact: true }).selectOption("cash");
  await page.getByRole("button", { name: "Continue" }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Current value").focus();
  await page.keyboard.type("60.50");
  await page.getByRole("button", { name: "Save account" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Account saved locally.")).toBeVisible();
});
