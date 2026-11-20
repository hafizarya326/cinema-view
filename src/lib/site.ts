const DEFAULT_SITE_URL = "http://localhost:3000";

export type SiteEnv = Readonly<Record<string, string | undefined>>;

/**
 * Resolves the canonical origin from optional env vars without requiring any
 * domain configuration. Always returns a valid origin without a trailing slash.
 */
export function getSiteUrl(env: SiteEnv = process.env): string {
  const raw =
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    env.VERCEL_URL?.trim();

  if (!raw) return DEFAULT_SITE_URL;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}
