import { defineConfig } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // The production server is a single Node process; too many workers starve it
  // and page.goto stalls waiting for "load".
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    // The bundled Playwright Chromium binary is blocked by this machine's
    // Application Control policy (spawn UNKNOWN), so drive the installed Chrome.
    channel: "chrome",
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
    command: "npm run build && npm run start",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});