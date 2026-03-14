// File-based response cache for development.
// First API call generates and caches. Subsequent calls return cached content instantly.
// Delete .cache/ directory to force fresh generation.

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), ".cache");

export function getCached(slug: string): string | null {
  try {
    return readFileSync(join(CACHE_DIR, `${slug}.md`), "utf-8");
  } catch {
    return null;
  }
}

export function setCache(slug: string, content: string): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(join(CACHE_DIR, `${slug}.md`), content, "utf-8");
}
