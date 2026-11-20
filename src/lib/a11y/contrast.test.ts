import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  WCAG_AA_LARGE_OR_UI,
  WCAG_AA_NORMAL_TEXT,
  contrastRatio,
  meetsWcagAA,
  parseHexColor,
  relativeLuminance,
} from "./contrast";
import { SEAT_COLORS, UI_TOKENS, VISIBILITY_COLORS } from "@/lib/studio/config";

describe("contrast utilities (pure WCAG 2.1 math)", () => {
  it("parses 3- and 6-digit hex colors and rejects invalid input", () => {
    expect(parseHexColor("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHexColor("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor("e50914")).toEqual({ r: 229, g: 9, b: 20 });
    expect(() => parseHexColor("not-a-color")).toThrow();
  });

  it("computes reference WCAG luminance and contrast ratios accurately", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBe(1);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#141416", "#141416")).toBeCloseTo(1, 5);
    expect(contrastRatio("#F5F5F7", "#0A0A0B")).toBeCloseTo(
      contrastRatio("#0A0A0B", "#F5F5F7"),
      10,
    );
    // WCAG reference: #767676 on #FFFFFF is the canonical ~4.54:1 AA boundary.
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
    expect(meetsWcagAA("#767676", "#FFFFFF", "normal")).toBe(true);
    expect(meetsWcagAA("#777777", "#FFFFFF", "normal")).toBe(false);
    expect(meetsWcagAA("#777777", "#FFFFFF", "large-or-ui")).toBe(true);
  });
});

describe("design token WCAG AA contrast compliance", () => {
  const normalTextPairs: Array<[string, string, string]> = [
    ["foreground on background", UI_TOKENS.foreground, UI_TOKENS.background],
    ["foreground on surface", UI_TOKENS.foreground, UI_TOKENS.surface],
    ["muted on background", UI_TOKENS.muted, UI_TOKENS.background],
    ["muted on surface", UI_TOKENS.muted, UI_TOKENS.surface],
    ["button text (foreground on accent)", UI_TOKENS.foreground, UI_TOKENS.accent],
    ["accent text on background", UI_TOKENS.accentText, UI_TOKENS.background],
    ["accent text on surface", UI_TOKENS.accentText, UI_TOKENS.surface],
    ["selected seat marker (background on seat-selected)", UI_TOKENS.background, SEAT_COLORS.selected],
    ["occupied seat marker (foreground on seat-occupied)", UI_TOKENS.foreground, SEAT_COLORS.occupied],
  ];

  it.each(normalTextPairs)("%s meets WCAG AA normal text (>= 4.5:1)", (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    expect(meetsWcagAA(fg, bg, "normal")).toBe(true);
  });

  const uiComponentPairs: Array<[string, string, string]> = [
    ["accent border/control on background", UI_TOKENS.accent, UI_TOKENS.background],
    ["accent border/control on surface", UI_TOKENS.accent, UI_TOKENS.surface],
  ];

  it.each(uiComponentPairs)("%s meets WCAG AA large text / UI (>= 3:1)", (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(WCAG_AA_LARGE_OR_UI);
    expect(meetsWcagAA(fg, bg, "large-or-ui")).toBe(true);
  });

  it("every VISIBILITY_COLORS label meets WCAG AA (>= 4.5:1) on surface and background", () => {
    for (const [label, color] of Object.entries(VISIBILITY_COLORS)) {
      expect(
        contrastRatio(color, UI_TOKENS.surface),
        `${label} (${color}) on surface`,
      ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(
        contrastRatio(color, UI_TOKENS.background),
        `${label} (${color}) on background`,
      ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    }
  });

  it("keeps UI_TOKENS in sync with CSS tokens in src/app/globals.css", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const cssVars: Record<keyof typeof UI_TOKENS, string> = {
      background: "--color-background",
      surface: "--color-surface",
      border: "--color-border",
      foreground: "--color-foreground",
      muted: "--color-muted",
      accent: "--color-accent",
      accentText: "--color-accent-text",
    };

    for (const [key, cssVar] of Object.entries(cssVars) as Array<[keyof typeof UI_TOKENS, string]>) {
      const match = css.match(new RegExp(`${cssVar}:\\s*(#[0-9a-fA-F]{6})`));
      expect(match?.[1]?.toUpperCase(), `${cssVar} in globals.css`).toBe(
        UI_TOKENS[key].toUpperCase(),
      );
    }
  });
});
