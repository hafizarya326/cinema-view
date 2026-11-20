import { defineConfig } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const IS_CI = Boolean(process.env.CI);
const USE_BUNDLED_CHROMIUM = process.env.PLAYWRIGHT_USE_BUNDLED_CHROMIUM === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // The production server is a single Node process; too many workers starve it
  // and page.goto stalls waiting for "load".
  workers: IS_CI ? 2 : 2,
  forbidOnly: IS_CI,
  retries: IS_CI ? 1 : 0,
  reporter: IS_CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    // Locally, bundled Playwright Chromium is blocked by Application Control policy
    // (spawn UNKNOWN), so drive the installed Chrome. On CI, ubuntu-latest ships
    // Google Chrome; if missing, the workflow sets PLAYWRIGHT_USE_BUNDLED_CHROMIUM=1.
    ...(USE_BUNDLED_CHROMIUM ? {} : { channel: "chrome" }),
    trace: "on-first-retry",
    // Headless Chromium has no GPU: allow the software WebGL (SwiftShader) path.
    launchOptions: {
      args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"],
    },
  },
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 360, height: 800 },
        hasTouch: true,
      },
    },
  ],
  webServer: {
    // CI runs `npm run build` as its own workflow step before `npm run e2e`.
    command: IS_CI ? "npm run start" : "npm run build && npm run start",
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: 240_000,
  },
});