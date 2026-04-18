// Resolves the site's canonical base URL for use in metadataBase, robots, and
// sitemap. Priority:
//   1. NEXT_PUBLIC_SITE_URL — explicit override (set this on Vercel when the
//      custom domain goes live).
//   2. VERCEL_PROJECT_PRODUCTION_URL — auto-set by Vercel to the production
//      alias (e.g. greenlight-public.vercel.app). Works without manual config.
//   3. localhost fallback for dev.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return stripTrailingSlash(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${stripTrailingSlash(vercel)}`;

  return "http://localhost:3001";
}

function stripTrailingSlash(u: string): string {
  return u.endsWith("/") ? u.slice(0, -1) : u;
}
