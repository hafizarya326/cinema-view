import { expect, test } from "@playwright/test";
import { MOVIE_ID, centerClick, openSeatMap, resetStorage, selectAvailable } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test("no horizontal body scroll on the main routes (mobile)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile-only check");

  const assertNoBodyScroll = async (label: string) => {
    const { bodyScrollWidth, viewportWidth } = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(
      bodyScrollWidth,
      `${label}: body scrollWidth ${bodyScrollWidth}px vs viewport ${viewportWidth}px`,
    ).toBeLessThanOrEqual(viewportWidth);
  };

  await page.goto("/");
  await assertNoBodyScroll("/");

  await page.goto("/movies");
  await assertNoBodyScroll("/movies");

  await page.goto(`/movies/${MOVIE_ID}`);
  await assertNoBodyScroll("/movies/[id]");

  await openSeatMap(page);
  await selectAvailable(page, 2);
  await assertNoBodyScroll("/booking/[id]");

  await centerClick(page.getByRole("link", { name: "Lihat Preview 3D" }));
  await expect(page.getByRole("heading", { name: "Preview Kursi 3D" })).toBeVisible();
  await page.waitForTimeout(1_000);
  await assertNoBodyScroll("/booking/preview");

  await page.goto("/checkout");
  await assertNoBodyScroll("/checkout");
});