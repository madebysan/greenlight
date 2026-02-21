// Trims the full screenplay JSON to only the fields each document type needs.
// Reduces Claude API input tokens by 40-60% for most document types.

type AnyData = Record<string, unknown>;
type AnyScene = Record<string, unknown>;
type AnyCharacter = Record<string, unknown>;
type AnyLocation = Record<string, unknown>;

function parseData(jsonString: string): AnyData {
  const raw = typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
  return raw as AnyData;
}

function pick<T extends Record<string, unknown>>(obj: T, keys: string[]): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result as Partial<T>;
}

// Scene Breakdown: needs scenes (full), locations (for count), title, total_pages
export function trimForSceneBreakdown(jsonString: string): string {
  const data = parseData(jsonString);
  return JSON.stringify({
    title: data.title,
    total_pages: data.total_pages,
    scenes: data.scenes,
    locations: (data.locations as AnyLocation[])?.map((l) => ({
      name: l.name,
      scenes: l.scenes,
    })),
  });
}

// Production Matrices: needs everything — full cross-reference
export function trimForProductionMatrices(jsonString: string): string {
  // Pass through — this document needs all data
  return jsonString;
}

// Marketing Brief: needs title/genre/tone/themes + character summaries + scene highlights
export function trimForMarketingBrief(jsonString: string): string {
  const data = parseData(jsonString);
  return JSON.stringify({
    title: data.title,
    genre: data.genre,
    setting_period: data.setting_period,
    tone: data.tone,
    themes: data.themes,
    characters: (data.characters as AnyCharacter[])?.map((c) => ({
      name: c.name,
      description: c.description,
      arc_summary: c.arc_summary,
    })),
    scenes: (data.scenes as AnyScene[])?.map((s) => ({
      scene_number: s.scene_number,
      slug_line: s.slug_line,
      key_visual_moment: s.key_visual_moment,
      emotional_beat: s.emotional_beat,
    })),
  });
}

// Storyboard Prompts: needs scene visuals, no character bios or location details
export function trimForStoryboardPrompts(jsonString: string): string {
  const data = parseData(jsonString);
  return JSON.stringify({
    title: data.title,
    scenes: (data.scenes as AnyScene[])?.map((s) => ({
      scene_number: s.scene_number,
      slug_line: s.slug_line,
      location: s.location,
      int_ext: s.int_ext,
      time_of_day: s.time_of_day,
      characters_present: s.characters_present,
      key_visual_moment: s.key_visual_moment,
      emotional_beat: s.emotional_beat,
      props: s.props,
      wardrobe_notes: s.wardrobe_notes,
    })),
  });
}

// Poster Concepts: needs title/genre/tone/themes + character looks + key visual moments
export function trimForPosterConcepts(jsonString: string): string {
  const data = parseData(jsonString);
  return JSON.stringify({
    title: data.title,
    genre: data.genre,
    tone: data.tone,
    themes: data.themes,
    characters: (data.characters as AnyCharacter[])?.map((c) => ({
      name: c.name,
      description: c.description,
    })),
    locations: (data.locations as AnyLocation[])?.map((l) => ({
      name: l.name,
      description: l.description,
    })),
    scenes: (data.scenes as AnyScene[])?.map((s) => ({
      scene_number: s.scene_number,
      slug_line: s.slug_line,
      key_visual_moment: s.key_visual_moment,
    })),
  });
}
