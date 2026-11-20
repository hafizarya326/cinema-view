import { describe, expect, it } from "vitest";
import { getSiteUrl } from "./site";

describe("getSiteUrl", () => {
  it("falls back to localhost when no env variable is set", () => {
    expect(getSiteUrl({})).toBe("http://localhost:3000");
  });

  it("prefers NEXT_PUBLIC_SITE_URL and strips trailing slashes/paths", () => {
    expect(
      getSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://cinema.example.com/",
        VERCEL_URL: "cinema-preview.vercel.app",
      }),
    ).toBe("https://cinema.example.com");
  });

  it("prepends https:// for host-only Vercel env variables", () => {
    expect(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "cinema-view.vercel.app" })).toBe(
      "https://cinema-view.vercel.app",
    );
    expect(getSiteUrl({ VERCEL_URL: "cinema-git-main.vercel.app" })).toBe(
      "https://cinema-git-main.vercel.app",
    );
  });

  it("falls back safely to localhost when the env value is invalid", () => {
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://invalid host:abc" })).toBe(
      "http://localhost:3000",
    );
  });
});
