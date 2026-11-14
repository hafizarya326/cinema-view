import { expect, test } from "@playwright/test";
import { openPreviewWithSeats, resetStorage, centerClick } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test("preview: scene renders, chips switch the active seat, table compares 2+ seats", async ({
  page,
}, testInfo) => {
  await openPreviewWithSeats(page, 2);

  // Pixel output is not tested; either the WebGL canvas or the 2D fallback is fine.
  const canvas = page.locator("canvas");
  const fallback = page.getByText(/WebGL tidak tersedia|Tampilan 3D berhenti/);
  await expect(canvas.or(fallback).first()).toBeVisible({ timeout: 30_000 });
  const sceneKind = (await canvas.count()) > 0 && (await canvas.first().isVisible())
    ? "WebGL canvas"
    : "2D fallback";
  console.log(`[preview] scene path: ${sceneKind}`);
  testInfo.annotations.push({ type: "scene", description: sceneKind });

  // Comparison table exists for two seats.
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText(/Perbandingan 2 kursi terpilih/)).toBeVisible();
  await expect(page.getByText("Aktif", { exact: true })).toBeVisible();

  const chips = page.getByRole("button", { name: /· Rp/ });
  await expect(chips).toHaveCount(2);
  const chipIds = await chips.evaluateAll((nodes) =>
    nodes.map((node) => (node.textContent ?? "").trim().split(" ")[0]),
  );
  const pressed = await chips.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("aria-pressed") === "true"),
  );

  const panel = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Info Pandangan" }) });

  const activeIndex = pressed.indexOf(true);
  const nextIndex = pressed.indexOf(false);

  // The panel follows the active seat.
  await expect(panel.getByText(chipIds[activeIndex], { exact: true })).toBeVisible();

  await centerClick(chips.nth(nextIndex));

  await expect(panel.getByText(chipIds[nextIndex], { exact: true })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Aktif" })).toContainText(
    chipIds[nextIndex],
  );
});