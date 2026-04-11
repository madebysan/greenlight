// Single active project — persisted to localStorage.
// Greenlight is single-project by design. See presentation.md for context.

export type SavedImage = {
  status: "done";
  url: string;
};

export type SavedProject = {
  title: string;
  createdAt: string;
  jsonData?: string;
  documents: {
    name: string;
    slug: string;
    status: "done" | "error";
    content: string | null;
    error: string | null;
  }[];
  images?: Record<number, SavedImage>;
  promptOverrides?: Record<number, string>;
  posterImages?: Record<number, SavedImage>;
  portraits?: Record<string, SavedImage>;
  propImages?: Record<string, SavedImage>;
  disabledItems?: Record<string, boolean>;
};

export const PROJECT_KEY = "greenlight-project";
export const API_KEY_STORAGE = "stp-api-key";
export const FAL_KEY_STORAGE = "stp-fal-key";

export function loadProject(): SavedProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProject(project: SavedProject): void {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  } catch {
    // Storage full — nothing to prune in single-project mode; give up silently.
  }
}

export function updateProject(patch: Partial<SavedProject>): void {
  const current = loadProject();
  if (!current) return;
  saveProject({ ...current, ...patch });
}

export function clearProject(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROJECT_KEY);
}

export function extractTitle(jsonData: string): string {
  try {
    const parsed = JSON.parse(jsonData);
    return parsed.title || "Untitled";
  } catch {
    return "Untitled";
  }
}
