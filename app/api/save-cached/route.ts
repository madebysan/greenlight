import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import type { SavedProject } from "@/lib/reports";

// Append/upsert a project into lib/cached-projects.ts, keyed by normalized
// title. Dev-only. Commit the generated file to persist the cache.
//
// This is the "bonus round" pipeline: preload A24 films so the interview demo
// can fake-generate documents in seconds when the interviewer pastes a JSON.
// Images are deliberately NOT cached — the demo walkthrough shows image
// generation as a separate step so the interviewer sees the real pipeline.

const CACHED_FILE = join(process.cwd(), "lib", "cached-projects.ts");

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

// Extract the existing CACHED_PROJECTS object literal from the source file so
// we can merge new entries without wiping old ones. The source is a stable
// shape — a single `export const CACHED_PROJECTS: Record<string, SavedProject> = {...}`.
function loadExistingCache(): Record<string, SavedProject> {
  if (!existsSync(CACHED_FILE)) return {};
  const src = readFileSync(CACHED_FILE, "utf8");
  const match = src.match(
    /export const CACHED_PROJECTS: Record<string, SavedProject> = ([\s\S]*?);\s*\n/,
  );
  if (!match) return {};
  try {
    // The object literal might have trailing function definitions after it,
    // so we trim to the closing brace.
    const literal = match[1].trim();
    return JSON.parse(literal) as Record<string, SavedProject>;
  } catch {
    return {};
  }
}

function writeCacheFile(projects: Record<string, SavedProject>): void {
  const content = `// Pre-cached projects for the demo path. Keyed by normalized film title.
// When a user pastes a screenplay JSON whose \`title\` matches one of these
// entries, the wizard skips real generation and fakes the progression using
// the cached state. Used for the A24 "bonus round" demo flow.
//
// Populated via POST /api/save-cached — hit "Save to cache (dev)" in the More
// menu after generating + regenerating images for a project.

import type { SavedProject } from "./reports";

export const CACHED_PROJECTS: Record<string, SavedProject> = ${JSON.stringify(projects, null, 2)};

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\\s]/g, "")
    .replace(/\\s+/g, "-")
    .trim();
}

export function findCachedProject(rawTitle: string): SavedProject | null {
  if (!rawTitle) return null;
  const key = normalizeTitle(rawTitle);
  return CACHED_PROJECTS[key] || null;
}
`;
  writeFileSync(CACHED_FILE, content);
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "save-cached is dev-only. Commit lib/cached-projects.ts to persist." },
      { status: 403 },
    );
  }

  try {
    const project = (await request.json()) as SavedProject;
    if (!project || !project.jsonData || !project.title) {
      return NextResponse.json({ error: "Missing project data or title" }, { status: 400 });
    }

    // Strip all image state — cache only the text content. The user walks
    // through image generation as a live step during the demo, so we want a
    // clean "just finished doc generation" state here.
    const stripped: SavedProject = {
      title: project.title,
      createdAt: project.createdAt,
      jsonData: project.jsonData,
      documents: project.documents,
      // Intentionally omit: images, posterImages, portraits, propImages,
      // promptOverrides, disabledItems. Cache hit starts fresh on images.
    };

    const existing = loadExistingCache();
    const key = normalizeTitle(project.title);
    existing[key] = stripped;
    writeCacheFile(existing);

    return NextResponse.json({
      ok: true,
      key,
      title: stripped.title,
      totalCached: Object.keys(existing).length,
      docCount: stripped.documents.filter((d) => d.status === "done").length,
    });
  } catch (error) {
    console.error("Save cached error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed" },
      { status: 500 },
    );
  }
}
