import { expect, test } from "@playwright/test";
import { MOVIE_ID, centerClick, openSeatMap, resetStorage, selectAvailable } from "./helpers";

const BASE_URL = "http://localhost:3000";
// Third-party trailer frames and generic network noise are not our console errors.
const IGNORED =
  /youtube|ytimg|doubleclick|googlevideo|Failed to load resource|net::ERR|favicon/i;

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test("no console errors or hydration warnings across the main flow", async ({ page }) => {
  const problems: string[] = [];

  page.on("console", (message) => {
    const text = message.text();
    const url = message.location().url;
    if (IGNORED.test(text)) return;
    if (url && !url.startsWith(BASE_URL)) return;

    if (message.type() === "error") problems.push(`console.error: ${text}`);
    else if (message.type() === "warning" && /hydrat/i.test(text)) {
      problems.push(`hydration warning: ${text}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));

  await page.goto("/");
  await page.waitForTimeout(500);

  await page.goto("/movies");
  await page.waitForTimeout(500);

  await page.goto(`/movies/${MOVIE_ID}`);
  await page.waitForTimeout(700);

  await openSeatMap(page);
  await selectAvailable(page, 2);
  await page.waitForTimeout(500);

  await centerClick(page.getByRole("link", { name: "Lihat Preview 3D" }));
  await page.waitForTimeout(2_500);

  await centerClick(page.getByRole("link", { name: "Lanjut ke Checkout" }));
  await page.waitForTimeout(700);

  expect(problems).toEqual([]);
});