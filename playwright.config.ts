import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 2,
  forbidOnly: true,
  retries: 0,
  reporter: "list",
  expect: { timeout: 10_000 },
  use: {
    baseURL: externalBaseUrl ?? "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  ...(externalBaseUrl === undefined
    ? {
        webServer: {
          command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
          url: "http://127.0.0.1:3100",
          env: {
            ...process.env,
            NEXT_PUBLIC_SUPABASE_URL: "",
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
          },
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }
    : {}),
});
