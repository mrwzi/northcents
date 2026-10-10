import { expect, test } from "@playwright/test";

test("allocates account money and models a purchase without changing the balance", async ({
  page,
}) => {
  await page.goto("/accounts");
  await page.getByRole("button", { name: "+ Add provider" }).click();
  await page.getByLabel("Bank name").fill("Test bank");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Current value").fill("1000");
  await page.getByRole("button", { name: "Save account" }).click();

  await page.getByRole("button", { name: "+ Account" }).click();
  await page.getByRole("button", { name: "Money I owe" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Current amount owed").fill("420");
  await page.getByLabel("Required monthly payment").fill("35");
  await page.getByRole("button", { name: "Save account" }).click();

  await page.goto("/plan");
  await expect(
    page
      .getByRole("region", { name: "What are you planning?" })
      .getByText("$1,000.00"),
  ).toBeVisible();

  await expect(page.getByText("Step 1 of 7")).toBeVisible();
  await page
    .getByRole("button", { name: "I do not pay housing costs" })
    .click();
  await page
    .getByRole("button", { name: "Utilities are included or not applicable" })
    .click();
  await page.getByLabel("Groceries amount").fill("250");
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("button", { name: "I do not have transportation costs" })
    .click();
  await page.getByLabel("Savings / goals amount").fill("100");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Clothing amount").fill("50");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "No entertainment amount" }).click();

  await expect(
    page.getByRole("listitem").filter({ hasText: "Debt payments" }),
  ).toContainText("$35.00");
  await expect(page.getByText("$565.00")).toBeVisible();
  await expect(page.getByText("Review plan checks")).toBeVisible();

  await page.getByText("Test a purchase").click();
  await page.getByLabel("Purchase amount").fill("75");
  await expect(page.getByText("Money after purchase:")).toContainText(
    "$925.00",
  );
  await expect(page.getByText("Category amount after purchase:")).toContainText(
    "$175.00",
  );
  await page.getByRole("button", { name: "Save plan" }).click();
  await expect(page.getByText("Plan saved on this device.")).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Groceries" }),
  ).toContainText("$250.00");
  await expect(
    page
      .getByRole("region", { name: "What are you planning?" })
      .getByText("$1,000.00"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Next payment" }).click();
  await page.getByLabel("Expected take-home payment").fill("1000");
  await page.getByRole("button", { name: "Create suggested split" }).click();
  await expect(
    page.getByText("Drafted from the proportions in your monthly plan."),
  ).toBeVisible();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Groceries" }),
  ).toContainText("$603.13");
  await expect(page.getByText("$1,000.00")).toHaveCount(2);

  await page.goto("/");
  await expect(page.getByText("Where your money goes")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Plan my next payment" }),
  ).toBeVisible();
});
