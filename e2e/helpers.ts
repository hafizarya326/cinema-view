import { expect, type Locator, type Page } from "@playwright/test";

export const MOVIE_ID = "langit-kedua";
export const SHOWTIME_EARLY = "12:00";
export const SHOWTIME_LATE = "15:00";

/** Fresh context already has empty storage; this makes it explicit before each test. */
export async function resetStorage(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

/** Booking page with the first showtime picked, so the seat map is on screen. */
export async function openSeatMap(page: Page, movieId = MOVIE_ID): Promise<void> {
  await page.goto(`/booking/${movieId}`);
  await centerClick(page.getByRole("button", { name: SHOWTIME_EARLY }));
  await expect(page.locator("[data-seat-id]").first()).toBeVisible();
}

/**
 * Clicks an element after centering it in the viewport. Without this, the sticky
 * header and the horizontally scrolled seat map intercept the click point on the
 * narrow mobile viewport.
 */
export async function centerClick(target: Locator): Promise<void> {
  await target.evaluate((element) =>
    element.scrollIntoView({ block: "center", inline: "center" }),
  );
  await target.click();
}

/** Fires the element's native click without hit-testing (e.g. an occupied seat). */
export async function domClick(target: Locator): Promise<void> {
  await target.evaluate((element) => (element as HTMLElement).click());
}

export function availableSeats(page: Page): Locator {
  return page.locator('[data-seat-id][aria-disabled="false"]');
}

export function selectedSeats(page: Page): Locator {
  return page.locator('[data-seat-id][aria-pressed="true"]');
}

export function seatId(locator: Locator): Promise<string[]> {
  return locator.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-seat-id") ?? ""));
}

export async function selectAvailable(page: Page, count: number): Promise<void> {
  const seats = availableSeats(page);
  for (let index = 0; index < count; index += 1) {
    await centerClick(seats.nth(index));
  }
}

/** Picks `count` seats and opens the 3D preview page. */
export async function openPreviewWithSeats(page: Page, count = 2): Promise<void> {
  await openSeatMap(page);
  await selectAvailable(page, count);
  await centerClick(page.getByRole("link", { name: "Lihat Preview 3D" }));
  await expect(page.getByRole("heading", { name: "Preview Kursi 3D" })).toBeVisible();
}
