// Customizable image-generation style prompts.
//
// Each of the four image endpoints (storyboard, portrait, prop, poster) uses a
// hardcoded style prefix to keep the generated art visually consistent across
// the whole pre-production bible. This module lets users override those
// defaults from Settings so they can render in their own style — painted, 3D
// blockout, cel-shaded, photographic reference, whatever fits the project.
//
// Storage: a single localStorage key holds a partial map. Missing keys fall
// back to the default. This keeps the Settings dialog simple and lets users
// override just one kind of image if they want.

export type ImagePromptKind = "storyboard" | "portrait" | "prop" | "poster";

export const DEFAULT_IMAGE_PROMPTS: Record<ImagePromptKind, string> = {
  storyboard:
    "Production storyboard rough, loose graphite pencil on white paper, gestural figures with multiple construction lines and unfinished edges, quick architectural blocking with straight pencil lines, soft graphite tone, working document quality, inside a thin rectangular storyboard panel border. " +
    "Monochrome graphite only, no ink, no marker, no rendering, no facial detail, no shading detail, no color, no text, no labels, no signatures. " +
    "Not polished art, not illustration — a 5-minute working sketch.",

  portrait:
    "Production sketchbook character study rough, loose graphite pencil on white paper, head and shoulders centered in frame, gestural construction lines with unfinished edges, suggested facial features without rendering, soft graphite tone, working sketchbook quality. " +
    "Monochrome graphite only, no ink, no marker, no color, no text, no labels, no signatures. " +
    "Not polished art — a quick 5-minute character sketch.",

  prop:
    "Production design prop study rough, loose graphite pencil on white paper, single isolated object centered in frame, no background, gestural construction lines with unfinished edges, soft graphite tone, working sketchbook quality. " +
    "Monochrome graphite only, no ink, no marker, no rendering, no color, no people, no text, no labels, no signatures. " +
    "Not polished art — a quick 5-minute prop reference sketch.",

  poster:
    "Production rough poster concept thumbnail, loose graphite pencil on white paper, gestural figures with multiple construction lines and unfinished edges, simple compositional blocking, soft graphite tone, working concept sketch quality. " +
    "Monochrome graphite only, no ink, no marker, no rendering, no color, no text, no words, no letters, no titles, no signatures. " +
    "Not finished art — a quick 5-minute poster thumbnail.",
};

// Wraps the user's subject prose on both sides. The AI-generated subject text
// is full of color, lighting, and mood words ("warm amber", "disco lights",
// "bittersweet") which overpower the style prefix on its own. Sandwiching the
// subject with explicit "ignore color" instructions before AND after is the
// only reliable way to keep FLUX in graphite-sketch mode on colorful prompts.
export const STYLE_OVERRIDE_PREFIX =
  "Render strictly as loose graphite pencil sketch — ignore any color, lighting, mood, or rendering descriptions in the subject below.";

export const STYLE_REINFORCEMENT =
  "Render this strictly as a loose graphite pencil sketch on white paper — monochrome graphite only, NO color whatsoever, no rendering, no shading detail, gestural construction lines with unfinished edges. Ignore any color, lighting, mood, or rendering details described in the subject above. Working sketchbook quality — not finished art.";

export const IMAGE_PROMPT_STORAGE = "greenlight-image-prompts";

type StoredPrompts = Partial<Record<ImagePromptKind, string>>;

export function loadImagePrompts(): StoredPrompts {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(IMAGE_PROMPT_STORAGE);
    return raw ? (JSON.parse(raw) as StoredPrompts) : {};
  } catch {
    return {};
  }
}

export function saveImagePrompts(prompts: StoredPrompts): void {
  if (typeof window === "undefined") return;
  // Drop empty strings so a blank field falls back to the default next time.
  const clean: StoredPrompts = {};
  for (const [k, v] of Object.entries(prompts)) {
    if (v && v.trim()) clean[k as ImagePromptKind] = v.trim();
  }
  if (Object.keys(clean).length === 0) {
    localStorage.removeItem(IMAGE_PROMPT_STORAGE);
    return;
  }
  localStorage.setItem(IMAGE_PROMPT_STORAGE, JSON.stringify(clean));
}

/**
 * Read the current style prefix for a given image kind. Browser-only —
 * returns undefined on the server so API routes can fall back to their own
 * defaults. Viewers call this right before a fetch to pass the user's custom
 * prompt (if any) in the request body.
 */
export function getStylePrefix(kind: ImagePromptKind): string | undefined {
  if (typeof window === "undefined") return undefined;
  const stored = loadImagePrompts();
  return stored[kind];
}
