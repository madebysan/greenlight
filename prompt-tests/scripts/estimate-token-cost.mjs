import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");
const RUN_ID = process.env.GREENLIGHT_TOKEN_RUN || "2026-05-14T15-12-11-062Z";
const RUN_DIR = join(PROJECT_ROOT, "prompt-tests", "runs", RUN_ID);
const CACHE_FILE = join(PROJECT_ROOT, "lib", "cached-projects.ts");
const TARGET_CACHE_KEY = "everything-everywhere-all-at-once";
const OUT_FILE = join(PROJECT_ROOT, "prompt-tests", "token-cost-estimate.md");

function approxTokens(text) {
  // Conservative English/code approximation. Actual tokenizer varies by model.
  return Math.ceil(text.length / 4);
}

function loadCachedProject() {
  const source = readFileSync(CACHE_FILE, "utf8");
  const match = source.match(
    /export const CACHED_PROJECTS: Record<string, SavedProject> = ([\s\S]*?);\s*\n\s*export function normalizeTitle/,
  );
  if (!match) throw new Error("Could not find CACHED_PROJECTS object");
  return JSON.parse(match[1])[TARGET_CACHE_KEY];
}

function getDoc(project, slug) {
  const doc = project.documents.find((d) => d.slug === slug && d.content);
  if (!doc?.content) throw new Error(`Missing cached document: ${slug}`);
  return doc.content;
}

function read(path) {
  return readFileSync(path, "utf8");
}

function readRun(path) {
  return read(join(RUN_DIR, path));
}

function parseData(jsonString) {
  return JSON.parse(jsonString);
}

function trimForOverview(data) {
  return JSON.stringify({
    title: data.title,
    writer: data.writer,
    based_on: data.based_on,
    genre: data.genre,
    setting_period: data.setting_period,
    tone: data.tone,
    themes: data.themes,
    total_pages: data.total_pages,
    characters: data.characters?.map((c) => ({
      name: c.name,
      description: c.description,
      arc_summary: c.arc_summary,
    })),
    locations: data.locations?.map((l) => ({
      name: l.name,
      description: l.description,
    })),
    scenes: data.scenes?.map((s) => ({
      scene_number: s.scene_number,
      slug_line: s.slug_line,
      int_ext: s.int_ext,
      time_of_day: s.time_of_day,
      key_visual_moment: s.key_visual_moment,
      emotional_beat: s.emotional_beat,
      vfx_stunts: s.vfx_stunts,
    })),
  });
}

function trimForMoodAndTone(data) {
  return JSON.stringify({
    title: data.title,
    genre: data.genre,
    setting_period: data.setting_period,
    tone: data.tone,
    themes: data.themes,
    characters: data.characters?.map((c) => ({
      name: c.name,
      arc_summary: c.arc_summary,
    })),
    scenes: data.scenes?.map((s) => ({
      scene_number: s.scene_number,
      slug_line: s.slug_line,
      key_visual_moment: s.key_visual_moment,
      emotional_beat: s.emotional_beat,
      music_cue: s.music_cue,
      time_of_day: s.time_of_day,
    })),
  });
}

function trimForSceneBreakdown(data) {
  return JSON.stringify({
    title: data.title,
    total_pages: data.total_pages,
    scenes: data.scenes,
    locations: data.locations?.map((l) => ({
      name: l.name,
      scenes: l.scenes,
    })),
  });
}

function trimForStoryboardPrompts(data) {
  return JSON.stringify({
    title: data.title,
    scenes: data.scenes?.map((s) => ({
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

function trimForPosterConcepts(data) {
  return JSON.stringify({
    title: data.title,
    genre: data.genre,
    tone: data.tone,
    themes: data.themes,
    characters: data.characters?.map((c) => ({
      name: c.name,
      description: c.description,
    })),
    locations: data.locations?.map((l) => ({
      name: l.name,
      description: l.description,
    })),
    scenes: data.scenes?.map((s) => ({
      scene_number: s.scene_number,
      slug_line: s.slug_line,
      key_visual_moment: s.key_visual_moment,
    })),
  });
}

function compactScene(scene) {
  return {
    scene_number: scene.scene_number,
    slug_line: scene.slug_line,
    location: scene.location,
    int_ext: scene.int_ext,
    time_of_day: scene.time_of_day,
    page_start: scene.page_start,
    page_end: scene.page_end,
    characters_present: scene.characters_present,
    key_visual_moment: scene.key_visual_moment,
    emotional_beat: scene.emotional_beat,
    props: scene.props,
    wardrobe_notes: scene.wardrobe_notes,
    vfx_stunts: scene.vfx_stunts,
    music_cue: scene.music_cue,
    notes: scene.notes,
  };
}

function baseIdentity(data) {
  return {
    title: data.title,
    writer: data.writer,
    based_on: data.based_on,
    genre: data.genre,
    setting_period: data.setting_period,
    tone: data.tone,
    total_pages: data.total_pages,
    themes: data.themes,
  };
}

function roleInput(data, role) {
  const identity = baseIdentity(data);
  if (role === "locations") {
    return JSON.stringify({
      ...identity,
      locations: data.locations,
      scenes: data.scenes.map((scene) => ({
        scene_number: scene.scene_number,
        slug_line: scene.slug_line,
        location: scene.location,
        int_ext: scene.int_ext,
        time_of_day: scene.time_of_day,
        page_start: scene.page_start,
        page_end: scene.page_end,
        key_visual_moment: scene.key_visual_moment,
        emotional_beat: scene.emotional_beat,
        vfx_stunts: scene.vfx_stunts,
        notes: scene.notes,
      })),
    });
  }
  if (role === "production") {
    return JSON.stringify({
      ...identity,
      locations: data.locations,
      props_master: data.props_master,
      characters: data.characters,
      scenes: data.scenes.map((scene) => ({
        ...compactScene(scene),
        characters_present: undefined,
      })),
    });
  }
  if (role === "cast") {
    return JSON.stringify({
      ...identity,
      characters: data.characters,
      scenes: data.scenes.map((scene) => ({
        scene_number: scene.scene_number,
        slug_line: scene.slug_line,
        characters_present: scene.characters_present,
        key_visual_moment: scene.key_visual_moment,
        emotional_beat: scene.emotional_beat,
        notes: scene.notes,
      })),
    });
  }
  if (role === "mood") {
    return JSON.stringify({
      ...identity,
      characters: data.characters.map((character) => ({
        name: character.name,
        arc_summary: character.arc_summary,
      })),
      scenes: data.scenes.map((scene) => ({
        scene_number: scene.scene_number,
        slug_line: scene.slug_line,
        location: scene.location,
        time_of_day: scene.time_of_day,
        key_visual_moment: scene.key_visual_moment,
        emotional_beat: scene.emotional_beat,
        music_cue: scene.music_cue,
      })),
    });
  }
  if (role === "key-art") {
    return JSON.stringify({
      ...identity,
      characters: data.characters,
      locations: data.locations,
      props_master: data.props_master,
      scenes: data.scenes.map((scene) => ({
        scene_number: scene.scene_number,
        slug_line: scene.slug_line,
        location: scene.location,
        key_visual_moment: scene.key_visual_moment,
        emotional_beat: scene.emotional_beat,
        props: scene.props,
      })),
    });
  }
  return JSON.stringify({
    ...identity,
    characters: data.characters,
    locations: data.locations,
    props_master: data.props_master,
    scenes: data.scenes.map(compactScene),
  });
}

function row(label, calls, input, output) {
  const total = input + output;
  return `| ${label} | ${calls} | ${input.toLocaleString()} | ${output.toLocaleString()} | ${total.toLocaleString()} |`;
}

const project = loadCachedProject();
const data = parseData(project.jsonData);

const currentPromptChars = {
  overview: read(join(PROJECT_ROOT, "lib/prompts/overview.ts")).length,
  mood: read(join(PROJECT_ROOT, "lib/prompts/mood-and-tone.ts")).length,
  scenes: read(join(PROJECT_ROOT, "lib/prompts/scene-breakdown.ts")).length,
  storyboard: read(join(PROJECT_ROOT, "lib/prompts/storyboard-prompts.ts")).length,
  posters: read(join(PROJECT_ROOT, "lib/prompts/poster-concepts.ts")).length,
};

const currentInputs = [
  currentPromptChars.overview + trimForOverview(data).length,
  currentPromptChars.mood + trimForMoodAndTone(data).length,
  currentPromptChars.scenes + trimForSceneBreakdown(data).length,
  currentPromptChars.storyboard + trimForStoryboardPrompts(data).length,
  currentPromptChars.posters + trimForPosterConcepts(data).length,
];
const currentOutputs = [
  getDoc(project, "overview"),
  getDoc(project, "mood-and-tone"),
  getDoc(project, "scene-breakdown"),
  getDoc(project, "storyboard-prompts"),
  getDoc(project, "poster-concepts"),
].map((s) => s.length);

const compareScript = read(join(PROJECT_ROOT, "prompt-tests/scripts/compare-role-passes.mjs"));
const rolePromptApproxChars = Math.ceil((compareScript.match(/const rolePrompts = \{([\s\S]*?)\n\};/)?.[1] || "").length / 8);
const groundingApproxChars = 650;
const creativeDirector = readRun("after/creative-director.md");
const roleOutputPaths = [
  "after/creative-director.md",
  "after/overview.md",
  "after/mood-and-tone.md",
  "after/locations.md",
  "after/cast-and-crew.md",
  "after/production-design.md",
  "after/title-and-palette.md",
  "after/poster-concepts.md",
];
const roleInputs = [
  groundingApproxChars + rolePromptApproxChars + roleInput(data, "all").length,
  groundingApproxChars + rolePromptApproxChars + creativeDirector.length + roleInput(data, "all").length,
  groundingApproxChars + rolePromptApproxChars + creativeDirector.length + roleInput(data, "mood").length,
  groundingApproxChars + rolePromptApproxChars + creativeDirector.length + roleInput(data, "locations").length,
  groundingApproxChars + rolePromptApproxChars + creativeDirector.length + roleInput(data, "cast").length,
  groundingApproxChars + rolePromptApproxChars + creativeDirector.length + roleInput(data, "production").length,
  groundingApproxChars + rolePromptApproxChars + creativeDirector.length + roleInput(data, "key-art").length,
  groundingApproxChars + rolePromptApproxChars + creativeDirector.length + roleInput(data, "key-art").length,
];
const roleOutputs = roleOutputPaths.map((path) => readRun(path).length);

const comparison = readRun("comparison.md");
const comparisonOutputTokens = approxTokens(comparison);
const comparisonInputTokens = Math.ceil(
  [
    "before/overview.md",
    "before/mood-and-tone.md",
    "before/locations.md",
    "before/cast-and-crew.md",
    "before/production-design.md",
    "before/title-and-palette.md",
    "before/posters.md",
    "after/overview.md",
    "after/mood-and-tone.md",
    "after/locations.md",
    "after/cast-and-crew.md",
    "after/production-design.md",
    "after/title-and-palette.md",
    "after/poster-concepts.md",
  ].reduce((sum, path) => sum + readRun(path).length, 0) / 4,
);

const currentInputTokens = currentInputs.reduce((sum, chars) => sum + approxTokens("x".repeat(chars)), 0);
const currentOutputTokens = currentOutputs.reduce((sum, chars) => sum + approxTokens("x".repeat(chars)), 0);
const roleInputTokens = roleInputs.reduce((sum, chars) => sum + approxTokens("x".repeat(chars)), 0);
const roleOutputTokens = roleOutputs.reduce((sum, chars) => sum + approxTokens("x".repeat(chars)), 0);

const content = `# Greenlight Token Cost Estimate

Run used for after-output sizing: \`${RUN_ID}\`  
Project: ${data.title}

These are rough token estimates using \`characters / 4\`. Actual tokenizer counts vary by provider, but this is accurate enough for planning.

## Summary

| Path | Calls | Input tokens | Output tokens | Total tokens |
|---|---:|---:|---:|---:|
${row("Current app generation", 5, currentInputTokens, currentOutputTokens)}
${row("Role-pass generation", 8, roleInputTokens, roleOutputTokens)}
${row("Role-pass + comparison harness", 15, roleInputTokens + comparisonInputTokens, roleOutputTokens + comparisonOutputTokens)}

## Interpretation

- The current app path is cheapest because it generates 5 markdown docs and derives several tabs directly from JSON in the UI.
- The role-pass path is roughly **${(roleInputTokens / currentInputTokens).toFixed(1)}x input tokens** and **${(roleOutputTokens / currentOutputTokens).toFixed(1)}x output tokens** compared with current generation.
- The comparison harness is intentionally more expensive because it also asks the model to review before/after pairs. That review cost should not ship in the app.
- The app-integrated version should target the **Role-pass generation** row, not the comparison row.

## Current App Generation Detail

| Doc | Input tokens | Output tokens |
|---|---:|---:|
| Overview | ${approxTokens("x".repeat(currentInputs[0])).toLocaleString()} | ${approxTokens("x".repeat(currentOutputs[0])).toLocaleString()} |
| Mood & Tone | ${approxTokens("x".repeat(currentInputs[1])).toLocaleString()} | ${approxTokens("x".repeat(currentOutputs[1])).toLocaleString()} |
| Scene Breakdown | ${approxTokens("x".repeat(currentInputs[2])).toLocaleString()} | ${approxTokens("x".repeat(currentOutputs[2])).toLocaleString()} |
| Storyboard Prompts | ${approxTokens("x".repeat(currentInputs[3])).toLocaleString()} | ${approxTokens("x".repeat(currentOutputs[3])).toLocaleString()} |
| Poster Concepts | ${approxTokens("x".repeat(currentInputs[4])).toLocaleString()} | ${approxTokens("x".repeat(currentOutputs[4])).toLocaleString()} |

## Role-Pass Generation Detail

| Pass | Input tokens | Output tokens |
|---|---:|---:|
| Creative Director | ${approxTokens("x".repeat(roleInputs[0])).toLocaleString()} | ${approxTokens("x".repeat(roleOutputs[0])).toLocaleString()} |
| Overview | ${approxTokens("x".repeat(roleInputs[1])).toLocaleString()} | ${approxTokens("x".repeat(roleOutputs[1])).toLocaleString()} |
| Mood & Tone | ${approxTokens("x".repeat(roleInputs[2])).toLocaleString()} | ${approxTokens("x".repeat(roleOutputs[2])).toLocaleString()} |
| Locations | ${approxTokens("x".repeat(roleInputs[3])).toLocaleString()} | ${approxTokens("x".repeat(roleOutputs[3])).toLocaleString()} |
| Cast & Crew | ${approxTokens("x".repeat(roleInputs[4])).toLocaleString()} | ${approxTokens("x".repeat(roleOutputs[4])).toLocaleString()} |
| Production Design | ${approxTokens("x".repeat(roleInputs[5])).toLocaleString()} | ${approxTokens("x".repeat(roleOutputs[5])).toLocaleString()} |
| Title & Palette | ${approxTokens("x".repeat(roleInputs[6])).toLocaleString()} | ${approxTokens("x".repeat(roleOutputs[6])).toLocaleString()} |
| Poster Concepts | ${approxTokens("x".repeat(roleInputs[7])).toLocaleString()} | ${approxTokens("x".repeat(roleOutputs[7])).toLocaleString()} |

## Cost-Control Notes

- Biggest input costs are the role passes that receive broad scene/location/prop context: Locations, Production Design, and the two Key Art passes.
- Biggest output costs are Locations and Poster Concepts.
- A production implementation should cap role output length and generate only the tabs the user opens, or run role passes in phases.
- A humanizer/editor pass would roughly add another read+rewrite of every after report. Budget it as about **+${roleOutputTokens.toLocaleString()} input tokens** and **+${Math.ceil(roleOutputTokens * 0.75).toLocaleString()} output tokens** if run on all role reports.
`;

writeFileSync(OUT_FILE, content, "utf8");
console.log(`Wrote ${OUT_FILE}`);
