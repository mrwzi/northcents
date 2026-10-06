import { expect, test } from "@playwright/test";

test("account entry remains honest when Supabase is not configured", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Cloud accounts are not configured yet",
    }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
});

test("demo mode works without an account", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("link", { name: "Try a demo" }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(
    page.getByRole("heading", { name: "Choose a synthetic starting point" }),
  ).toBeVisible();
});
