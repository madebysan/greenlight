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
    "Film production storyboard panel in the style of Ridley Scott's hand-drawn storyboards. " +
    "Black felt-tip marker on white paper, inside a thin rectangular panel border. " +
    "Loose but confident linework, simple crosshatching for shadows, stick-figure proportions with just enough detail to read the action. " +
    "Strictly black and white only. No color whatsoever, no yellow, no red, no tints, pure black ink on white paper. " +
    "No text, no labels, no captions, no signatures, no initials, no watermarks, no dates, no lined paper.",

  portrait:
    "Character portrait sketch, production art style. " +
    "Black felt-tip marker on white paper, head and shoulders only, centered in frame. " +
    "Loose but confident linework, simple crosshatching for shadows. " +
    "Strictly black and white only. No color whatsoever, pure black ink on white paper. " +
    "No text, no labels, no signatures, no watermarks. Square composition.",

  prop:
    "Prop reference sketch, production art style. " +
    "Black felt-tip marker on white paper. Single isolated object, centered in frame, no background detail. " +
    "Loose but confident linework, simple crosshatching for shadows. " +
    "Strictly black and white only. No color whatsoever, pure black ink on white paper. " +
    "No people, no text, no labels, no signatures, no watermarks. Square composition.",

  poster:
    "Film poster concept sketch, production art style. " +
    "Black felt-tip marker on white paper. " +
    "Loose but confident linework, simple crosshatching for shadows, gestural figures with just enough detail to convey the composition. " +
    "Strictly black and white only. No color whatsoever, pure black ink on white paper. " +
    "No text, no words, no letters, no titles, no signatures, no watermarks, no dates. Image only.",
};

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
