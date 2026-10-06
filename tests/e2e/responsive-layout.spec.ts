import { expect, test, type Page } from "@playwright/test";

const routes = [
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
] as const;

async function layoutMetrics(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    const mainBox = main?.getBoundingClientRect();
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      mainLeft: mainBox?.left ?? -1,
      mainRight: mainBox?.right ?? Number.POSITIVE_INFINITY,
    };
  });
}

for (const viewport of [
  { name: "small phone", width: 320, height: 700 },
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "small Windows laptop", width: 1024, height: 768 },
  { name: "Windows desktop", width: 1366, height: 768 },
  { name: "wide desktop", width: 1920, height: 1080 },
] as const) {
  test(`${viewport.name} keeps every primary route inside the viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      const metrics = await layoutMetrics(page);
      expect(
        metrics.scrollWidth,
        `${route} has page-level overflow`,
      ).toBeLessThanOrEqual(metrics.clientWidth);
      expect(
        metrics.mainLeft,
        `${route} starts outside the viewport`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        metrics.mainRight,
        `${route} ends outside the viewport`,
      ).toBeLessThanOrEqual(metrics.clientWidth);
    }

    const mobileNavigation = page.getByRole("navigation", {
      name: "App navigation",
    });
    const desktopNavigation = page.getByRole("navigation", {
      name: "Primary navigation",
    });
    if (viewport.width <= 760) {
      await expect(mobileNavigation).toBeVisible();
      await expect(desktopNavigation).toBeHidden();
    } else {
      await expect(mobileNavigation).toBeHidden();
      await expect(desktopNavigation).toBeVisible();
    }
  });
}

test("account entry dialog stays fully usable on the smallest screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/accounts");
  await page.getByRole("button", { name: "+ Add" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  expect(box?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(568);
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
});

test("accounts use available desktop space without stretching indefinitely", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/accounts");
  const width = await page
    .locator(".accounts-page")
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(720);
  expect(width).toBeLessThanOrEqual(960);
});
