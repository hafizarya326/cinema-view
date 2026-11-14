import { expect, test } from "@playwright/test";
import {
  MOVIE_ID,
  SHOWTIME_EARLY,
  SHOWTIME_LATE,
  availableSeats,
  centerClick,
  domClick,
  openSeatMap,
  resetStorage,
  seatId,
  selectAvailable,
  selectedSeats,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetStorage(page);
});

test("full booking flow: home -> movie -> showtime -> 2 seats -> preview -> checkout -> booking code", async ({
  page,
}) => {
  await page.goto("/");
  await centerClick(page.getByRole("link", { name: "Lihat Detail" }));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await centerClick(page.getByRole("link", { name: "Booking", exact: true }));
  await centerClick(page.getByRole("button", { name: SHOWTIME_EARLY }));
  await expect(page.locator("[data-seat-id]").first()).toBeVisible();

  await selectAvailable(page, 2);
  await expect(selectedSeats(page)).toHaveCount(2);

  await centerClick(page.getByRole("link", { name: "Lihat Preview 3D" }));
  await centerClick(page.getByRole("link", { name: "Lanjut ke Checkout" }));
  await centerClick(page.getByRole("button", { name: "Konfirmasi Pesanan" }));

  await expect(page.getByText("Kode booking", { exact: true })).toBeVisible();
  await expect(page.getByText(/^CV-[A-Z0-9]{6}$/)).toBeVisible();
});

test("a booked seat is occupied for the same showtime but free for another", async ({ page }) => {
  await page.goto(`/booking/${MOVIE_ID}`);

  const idsForShowtime = async (time: string) => {
    await centerClick(page.getByRole("button", { name: time }));
    await expect(page.locator("[data-seat-id]").first()).toBeVisible();
    return seatId(availableSeats(page));
  };

  // A seat that starts free in both showtimes, so the only difference is the booking.
  const earlyIds = await idsForShowtime(SHOWTIME_EARLY);
  const lateIds = await idsForShowtime(SHOWTIME_LATE);
  const shared = earlyIds.filter((id) => lateIds.includes(id));
  expect(shared.length).toBeGreaterThan(0);
  const bookedSeat = shared[0];

  await centerClick(page.getByRole("button", { name: SHOWTIME_EARLY }));
  await centerClick(page.locator(`[data-seat-id="${bookedSeat}"]`));
  await centerClick(page.getByRole("link", { name: "Lihat Preview 3D" }));
  await centerClick(page.getByRole("link", { name: "Lanjut ke Checkout" }));
  await centerClick(page.getByRole("button", { name: "Konfirmasi Pesanan" }));
  await expect(page.getByText(/^CV-[A-Z0-9]{6}$/)).toBeVisible();

  // Same showtime: the seat comes back occupied and refuses selection.
  await page.goto(`/booking/${MOVIE_ID}`);
  await centerClick(page.getByRole("button", { name: SHOWTIME_EARLY }));
  const seat = page.locator(`[data-seat-id="${bookedSeat}"]`);
  await expect(seat).toHaveAttribute("aria-disabled", "true");
  await domClick(seat);
  await expect(seat).toHaveAttribute("aria-pressed", "false");

  // Another showtime: that same seat id is bookable again.
  await centerClick(page.getByRole("button", { name: SHOWTIME_LATE }));
  await expect(seat).toHaveAttribute("aria-disabled", "false");
});

test("selection stops at six seats", async ({ page }) => {
  await openSeatMap(page);

  const seats = availableSeats(page);
  for (let index = 0; index < 7; index += 1) {
    await centerClick(seats.nth(index));
  }

  await expect(selectedSeats(page)).toHaveCount(6);
});

test("checkout without seats shows the empty state and a link to /movies", async ({ page }) => {
  await page.goto("/checkout");

  await expect(page.getByText(/belum ada kursi yang dipilih/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Pilih film" })).toHaveAttribute("href", "/movies");
});

test("seat map keyboard: one tab stop, arrows move focus, Enter selects", async ({ page }) => {
  await openSeatMap(page);

  // Roving tabindex: only one seat is reachable with Tab.
  await expect(page.locator('[data-seat-id][tabindex="0"]')).toHaveCount(1);

  await page.locator('[data-seat-id][tabindex="0"]').focus();
  await page.keyboard.press("Tab");
  const focusedSeat = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-seat-id"),
  );
  expect(focusedSeat).toBeNull();

  const firstId = (await availableSeats(page).first().getAttribute("data-seat-id")) ?? "";
  const seat = page.locator(`[data-seat-id="${firstId}"]`);
  await seat.focus();
  await page.keyboard.press("Enter");
  await expect(seat).toHaveAttribute("aria-pressed", "true");

  const row = firstId.slice(0, 1);
  const number = Number(firstId.slice(1));
  const forward = number < 14;
  const nextId = `${row}${forward ? number + 1 : number - 1}`;
  await page.keyboard.press(forward ? "ArrowRight" : "ArrowLeft");
  await expect(page.locator(`[data-seat-id="${nextId}"]`)).toBeFocused();
});

test("recommendation: 1 seat is a top scorer, 4 seats are adjacent in one row", async ({
  page,
}) => {
  await openSeatMap(page);
  const input = page.getByLabel("Jumlah kursi");

  await input.fill("1");
  await centerClick(page.getByRole("button", { name: "Pilih kursi terbaik" }));
  await expect(selectedSeats(page)).toHaveCount(1);

  const [bestId] = await seatId(selectedSeats(page));
  // The maximum visibility score lives in the back premium rows. The tie-break
  // (same price, then distance to center) lands on row I, so either back row is
  // valid here; see the report for the spec/implementation note.
  expect(bestId).toMatch(/^[IJ]\d+$/);

  await centerClick(page.getByRole("button", { name: "Hapus semua kursi" }));
  await input.fill("4");
  await centerClick(page.getByRole("button", { name: "Pilih kursi terbaik" }));
  await expect(selectedSeats(page)).toHaveCount(4);

  const ids = await seatId(selectedSeats(page));
  expect(new Set(ids.map((id) => id.slice(0, 1))).size).toBe(1);
  const numbers = ids.map((id) => Number(id.slice(1))).sort((a, b) => a - b);
  expect(numbers[numbers.length - 1] - numbers[0]).toBe(3);
  numbers.forEach((value, index) => {
    if (index > 0) expect(value).toBe(numbers[index - 1] + 1);
  });
});