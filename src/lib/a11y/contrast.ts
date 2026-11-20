export const WCAG_AA_NORMAL_TEXT = 4.5;
export const WCAG_AA_LARGE_OR_UI = 3.0;

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** Parses a 3- or 6-digit hex color string (with or without leading #) into 0..255 RGB channels. */
export function parseHexColor(hex: string): RgbColor {
  const cleaned = hex.trim().replace(/^#/, "");
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  const value = Number.parseInt(expanded, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function linearizeChannel(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.1 relative luminance in the range [0, 1]. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHexColor(hex);
  return (
    0.2126 * linearizeChannel(r) +
    0.7152 * linearizeChannel(g) +
    0.0722 * linearizeChannel(b)
  );
}

/** WCAG 2.1 contrast ratio between two hex colors in the range [1, 21]. */
export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when the contrast ratio meets WCAG AA for normal text (4.5:1) or large text/UI (3:1). */
export function meetsWcagAA(
  foregroundHex: string,
  backgroundHex: string,
  kind: "normal" | "large-or-ui" = "normal",
): boolean {
  const threshold = kind === "normal" ? WCAG_AA_NORMAL_TEXT : WCAG_AA_LARGE_OR_UI;
  return contrastRatio(foregroundHex, backgroundHex) >= threshold;
}
