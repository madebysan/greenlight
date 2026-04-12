// File-based response cache keyed by slug + input hash.
// Same screenplay data returns cached content; different data triggers fresh generation.
// Delete .cache/ directory to force fresh generation.

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

const CACHE_DIR = join(process.cwd(), ".cache");

function cacheKey(slug: string, jsonData: string): string {
  const hash = createHash("sha256").update(jsonData).digest("hex").slice(0, 12);
  return `${slug}-${hash}`;
}

export function getCached(slug: string, jsonData: string): string | null {
  try {
    return readFileSync(join(CACHE_DIR, `${cacheKey(slug, jsonData)}.md`), "utf-8");
  } catch {
    return null;
  }
}

export function setCache(slug: string, jsonData: string, content: string): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(join(CACHE_DIR, `${cacheKey(slug, jsonData)}.md`), content, "utf-8");
  } catch {
    // Read-only filesystem (Vercel) — skip caching silently
  }
}
