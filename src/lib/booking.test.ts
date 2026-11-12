import { describe, expect, it } from "vitest";
import {
  formatDegrees,
  formatMeters,
  formatRupiah,
  getCategoryLabel,
  getSeatAriaLabel,
  getSeatsSubtotal,
} from "./booking";
import { createSeat } from "./studio/seats";
import type { SeatStatus } from "@/types";

const f7 = createSeat("F", 5, 7); // standard, Rp50.000
const g7 = createSeat("G", 6, 7); // premium, Rp65.000

function withStatus(seat: typeof f7, status: SeatStatus) {
  return { ...seat, status };
}

describe("formatRupiah", () => {
  it("formats without decimals using dot separators", () => {
    expect(formatRupiah(40000)).toBe("Rp40.000");
    expect(formatRupiah(115000)).toBe("Rp115.000");
    expect(formatRupiah(0)).toBe("Rp0");
  });
});

describe("getCategoryLabel", () => {
  it("labels every category", () => {
    expect(getCategoryLabel("front")).toBe("Front");
    expect(getCategoryLabel("standard")).toBe("Standard");
    expect(getCategoryLabel("premium")).toBe("Premium");
  });
});

describe("getSeatAriaLabel", () => {
  it("describes an available seat", () => {
    expect(getSeatAriaLabel(f7)).toBe("Baris F kursi 7, Standard, Rp50.000, tersedia");
  });

  it("describes selected, occupied and unavailable seats", () => {
    expect(getSeatAriaLabel(g7, true)).toBe("Baris G kursi 7, Premium, Rp65.000, terpilih");
    expect(getSeatAriaLabel(withStatus(f7, "occupied"))).toContain("terisi");
    expect(getSeatAriaLabel(withStatus(f7, "unavailable"))).toContain("tidak tersedia");
  });
});

describe("getSeatsSubtotal", () => {
  it("sums the seat prices", () => {
    expect(getSeatsSubtotal([f7, g7])).toBe(115000);
    expect(getSeatsSubtotal([])).toBe(0);
  });
});

describe("formatMeters", () => {
  it("keeps one decimal and appends the unit", () => {
    expect(formatMeters(6.0748)).toBe("6.1 m");
    expect(formatMeters(12)).toBe("12.0 m");
  });
});

describe("formatDegrees", () => {
  it("keeps one decimal and appends the degree sign", () => {
    expect(formatDegrees(35.46)).toBe("35.5°");
    expect(formatDegrees(0)).toBe("0.0°");
  });
});
