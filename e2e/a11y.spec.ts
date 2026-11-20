import { expect, test, type Page } from "@playwright/test";
import {
  MOVIE_ID,
  centerClick,
  openPreviewWithSeats,
  openSeatMap,
  resetStorage,
  selectAvailable,
} from "./helpers";

async function assertStructureAndHeadings(page: Page, routeLabel: string) {
  // Check real exposed ARIA roles (Next.js 16 Activity may keep previous routes in display:none).
  await expect(
    page.getByRole("heading", { level: 1 }),
    `${routeLabel}: expected exactly one exposed h1`,
  ).toHaveCount(1);
  await expect(page.getByRole("main"), `${routeLabel}: main landmark`).toHaveCount(1);
  await expect(page.getByRole("navigation"), `${routeLabel}: nav landmark`).toHaveCount(1);
  await expect(page.getByRole("contentinfo"), `${routeLabel}: footer landmark`).toHaveCount(1);

  const skips = await page.evaluate(() => {
    const isExposed = (el: Element): boolean => {
      let current: Element | null = el;
      while (current) {
        if (current.getAttribute("aria-hidden") === "true" || current.hasAttribute("hidden")) {
          return false;
        }
        const style = window.getComputedStyle(current);
        if (style.display === "none" || style.visibility === "hidden") return false;
        current = current.parentElement;
      }
      return true;
    };

    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .filter(isExposed)
      .map((el) => Number(el.tagName.slice(1)));

    const issues: string[] = [];
    for (let i = 1; i < headings.length; i += 1) {
      if (headings[i] - headings[i - 1] > 1) {
        issues.push(`h${headings[i - 1]} -> h${headings[i]}`);
      }
    }
    return issues;
  });

  expect(skips, `${routeLabel}: unexpected skipped heading levels`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test("skip link becomes visible on focus and moves focus to main", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Lewati ke konten" });
  await expect(skipLink).toBeFocused();

  const box = await skipLink.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(20);
  expect(box!.height).toBeGreaterThan(20);

  await page.keyboard.press("Enter");
  await expect(page.locator("main#main-content")).toBeFocused();
});

test("every main route has exactly one h1, valid heading hierarchy, and landmarks", async ({
  page,
}) => {
  await page.goto("/");
  await assertStructureAndHeadings(page, "/");

  await page.goto("/movies");
  await assertStructureAndHeadings(page, "/movies");

  await page.goto(`/movies/${MOVIE_ID}`);
  await assertStructureAndHeadings(page, `/movies/${MOVIE_ID}`);

  await openSeatMap(page);
  await assertStructureAndHeadings(page, `/booking/${MOVIE_ID}`);

  await selectAvailable(page, 2);
  await centerClick(page.getByRole("link", { name: "Lihat Preview 3D" }));
  await expect(page.getByRole("heading", { name: "Preview Kursi 3D" })).toBeVisible();
  await assertStructureAndHeadings(page, "/booking/preview");

  await centerClick(page.getByRole("link", { name: "Lanjut ke Checkout" }));
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await assertStructureAndHeadings(page, "/checkout");
});

test("aria-live polite announces seat count and total price on seat map and checkout", async ({
  page,
}) => {
  await openSeatMap(page);

  const seatLive = page.getByTestId("seat-selection-live");
  await expect(seatLive).toHaveAttribute("aria-live", "polite");
  await expect(seatLive).toContainText("Belum ada kursi dipilih");

  await selectAvailable(page, 2);
  await expect(seatLive).toContainText("2 kursi dipilih");
  await expect(seatLive).toContainText("Rp");

  await centerClick(page.getByRole("link", { name: "Lihat Preview 3D" }));
  await centerClick(page.getByRole("link", { name: "Lanjut ke Checkout" }));

  const checkoutLive = page.getByTestId("checkout-live");
  await expect(checkoutLive).toHaveAttribute("aria-live", "polite");
  await expect(checkoutLive).toContainText("2 kursi dipilih");
  await expect(checkoutLive).toContainText("Rp");
});

test("3D scene has instructions, active seat SR summary outside canvas, and no keyboard trap", async ({
  page,
}) => {
  await openPreviewWithSeats(page, 2);

  const summary = page.getByTestId("active-seat-summary");
  await expect(summary).toContainText(/Baris [A-J] kursi \d+/);
  await expect(summary).toContainText(/skor visibilitas \d+/);

  const region = page.getByRole("region", { name: "Pratinjau 3D studio" });
  const fallback = page.getByText(/WebGL tidak tersedia|Tampilan 3D berhenti/);
  await expect(region.or(fallback).first()).toBeVisible({ timeout: 30_000 });

  const hasWebglRegion = (await region.count()) > 0 && (await region.isVisible());
  if (hasWebglRegion) {
    const describedBy = await region.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`[id="${describedBy}"]`)).toContainText(/panah/i);

    await region.focus();
    await expect(region).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(region).not.toBeFocused();

    await region.focus();
    await expect(region).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(region).not.toBeFocused();
  }
});
