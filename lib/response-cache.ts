// File-based response cache for development.
// First API call generates and caches. Subsequent calls return cached content instantly.
// Delete .cache/ directory to force fresh generation.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), ".cache");

export function getCached(slug: string): string | null {
  const path = join(CACHE_DIR, `${slug}.md`);
  if (existsSync(path)) {
    return readFileSync(path, "utf-8");
  }
  return null;
}

export function setCache(slug: string, content: string): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(join(CACHE_DIR, `${slug}.md`), content, "utf-8");
}
