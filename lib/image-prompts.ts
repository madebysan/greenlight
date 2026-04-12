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
    "gstdrw style, black ink on pure white paper, rough lines, expressive strokes, minimal background, storyboard sketch, no color, no tint, no tone",

  portrait:
    "gstdrw style, black ink on pure white paper, rough lines, expressive strokes, minimal background, character portrait sketch, head and shoulders, no color, no tint, no tone",

  prop:
    "gstdrw style, black ink on pure white paper, rough lines, expressive strokes, minimal background, single isolated object, no people, no color, no tint, no tone",

  poster:
    "gstdrw style, black ink on pure white paper, rough lines, expressive strokes, minimal background, poster composition sketch, no color, no tint, no tone",
};

export const IMAGE_NEGATIVE_PROMPT =
  "color, colorful, photorealistic, detailed rendering, polished, finished art, shading, 3d render, sepia, yellow, warm tint, aged paper, brown, amber, toned paper";

export const GESTURE_DRAW_LORA_URL =
  "https://huggingface.co/glif/Gesture-Draw/resolve/main/Gesture_Draw_v1.safetensors";

export const GESTURE_DRAW_LORA_SCALE = 1.0;

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
