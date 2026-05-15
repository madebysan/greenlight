#!/usr/bin/env node

import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DOCUMENTS = [
  { name: "Overview", slug: "overview" },
  { name: "Mood & Tone", slug: "mood-and-tone" },
  { name: "Scenes", slug: "scene-breakdown" },
  { name: "Storyboards", slug: "storyboard-prompts" },
  { name: "Poster Concepts", slug: "poster-concepts" },
];

const DEFAULT_BASE_URL = "http://localhost:3000";
const MAX_IMAGE_CONCURRENCY = Number(process.env.GREENLIGHT_IMAGE_CONCURRENCY || 5);

function usage() {
  console.error(
    [
      "Usage: node prompt-tests/scripts/build-demo-fixture.mjs <input-json> <slug> <export-name> [--force-images|--reuse-images]",
      "",
      "Image behavior:",
      "  default         Refuse a non-empty public/demo-images/<slug>/ folder.",
      "  --force-images  Regenerate and overwrite existing images for this slug.",
      "  --reuse-images  Reuse existing images and only generate missing files.",
    ].join("\n"),
  );
  process.exit(1);
}

function timestamp() {
  return new Date().toISOString().replace("T", " ").replace(/\..+/, "");
}

function log(message) {
  console.log(`[${timestamp()}] ${message}`);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function validateScreenplayData(data) {
  const errors = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    errors.push("Expected a JSON object.");
  }
  if (!data.title) errors.push("Missing title.");
  if (!Array.isArray(data.genre) || data.genre.length === 0) errors.push("Missing genre array.");
  if (!Array.isArray(data.scenes) || data.scenes.length === 0) errors.push("Missing scenes.");
  if (!Array.isArray(data.characters) || data.characters.length === 0) {
    errors.push("Missing characters.");
  }
  if (!Array.isArray(data.locations)) errors.push("Missing locations.");
  if (!Array.isArray(data.props_master)) errors.push("Missing props_master.");
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
}

async function postJson(baseUrl, route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `${route} failed with HTTP ${response.status}`);
  }
  return payload;
}

async function generateDocuments({ baseUrl, jsonData }) {
  if (process.env.GREENLIGHT_TEXT_PROVIDER === "local") {
    log("Generating report documents locally...");
    const data = JSON.parse(jsonData);
    return buildLocalDocuments(data);
  }

  log("Generating report documents...");
  const results = await Promise.all(
    DOCUMENTS.map(async (document) => {
      const payload = await postJson(baseUrl, `/api/generate/${document.slug}`, {
        jsonData,
        apiProvider: "anthropic",
        apiKey: "",
      });
      log(`Document done: ${document.name}`);
      return {
        name: document.name,
        slug: document.slug,
        status: "done",
        content: payload.content,
        error: null,
      };
    }),
  );
  return results;
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : value;
}

function normalizeTitle(value, slug) {
  const title = cleanString(value) || "Untitled";
  if (slug === "dune-part-one" && /^dune$/i.test(title)) return "Dune: Part One";
  if (title === title.toUpperCase()) return titleCase(title.toLowerCase());
  return title;
}

function normalizeData(data, slug) {
  return {
    ...data,
    title: normalizeTitle(data.title, slug),
    writer: cleanString(data.writer),
    based_on: cleanString(data.based_on),
    setting_period: cleanString(data.setting_period),
    tone: cleanString(data.tone),
    genre: data.genre.map(cleanString),
    themes: data.themes.map(cleanString),
    scenes: data.scenes.map((scene) => ({
      ...scene,
      slug_line: cleanString(scene.slug_line),
      location: cleanString(scene.location),
      int_ext: cleanString(scene.int_ext),
      time_of_day: cleanString(scene.time_of_day),
      key_visual_moment: cleanString(scene.key_visual_moment),
      emotional_beat: cleanString(scene.emotional_beat),
      music_cue: cleanString(scene.music_cue),
      notes: cleanString(scene.notes),
      props: scene.props.map(cleanString),
      wardrobe_notes: scene.wardrobe_notes.map(cleanString),
      vfx_stunts: scene.vfx_stunts.map(cleanString),
    })),
    characters: data.characters.map((character) => ({
      ...character,
      name: cleanString(character.name),
      description: cleanString(character.description),
      arc_summary: cleanString(character.arc_summary),
      special_requirements: character.special_requirements.map(cleanString),
    })),
    locations: data.locations.map((location) => ({
      ...location,
      name: cleanString(location.name),
      description: cleanString(location.description),
      int_ext: cleanString(location.int_ext),
      set_requirements: location.set_requirements.map(cleanString),
    })),
    props_master: data.props_master.map((prop) => ({
      ...prop,
      item: cleanString(prop.item),
      notes: cleanString(prop.notes),
    })),
  };
}

function titleCase(value) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function sentence(value) {
  if (!value) return "";
  return value.endsWith(".") ? value : `${value}.`;
}

function list(items, fallback = "None") {
  return items?.length ? items.join(", ") : fallback;
}

function countScenes(data, predicate) {
  return data.scenes.filter(predicate).length;
}

function topBySceneCount(items, sceneKey = "scenes", limit = 3) {
  return [...items].sort((a, b) => (b[sceneKey]?.length || 0) - (a[sceneKey]?.length || 0)).slice(0, limit);
}

function buildLocalDocuments(data) {
  const documents = [
    { name: "Overview", slug: "overview", content: buildOverviewDocument(data) },
    { name: "Mood & Tone", slug: "mood-and-tone", content: buildMoodDocument(data) },
    { name: "Scenes", slug: "scene-breakdown", content: buildSceneDocument(data) },
    { name: "Storyboards", slug: "storyboard-prompts", content: buildStoryboardDocument(data) },
    { name: "Poster Concepts", slug: "poster-concepts", content: buildPosterDocument(data) },
  ];

  return documents.map((document) => ({
    ...document,
    status: "done",
    error: null,
  }));
}

function buildOverviewDocument(data) {
  const locationCount = data.locations.length;
  const extScenes = countScenes(data, (scene) => scene.int_ext.includes("EXT"));
  const nightScenes = countScenes(data, (scene) => /NIGHT|CONTINUOUS/i.test(scene.time_of_day));
  const stuntScenes = countScenes(data, (scene) => scene.vfx_stunts.length > 0);
  const centralLocation = topBySceneCount(data.locations, "scenes", 1)[0]?.name || "primary location";
  const lead = topBySceneCount(data.characters, "scenes_present", 1)[0];
  const firstSetPiece = data.scenes.find((scene) => scene.vfx_stunts.length > 0) || data.scenes[0];
  const lastScene = data.scenes.at(-1);
  const heroProps = data.props_master.filter((prop) => prop.hero_prop).slice(0, 4);
  const themeLines = data.themes.slice(0, 4).map((theme) => {
    const evidence = data.scenes.find((scene) => {
      const haystack = `${scene.key_visual_moment} ${scene.notes} ${scene.emotional_beat}`.toLowerCase();
      return theme.toLowerCase().split(/\s+/).some((word) => word.length > 5 && haystack.includes(word));
    }) || data.scenes[0];
    return `**${theme}**\nScene ${evidence.scene_number} gives this theme a concrete production anchor: ${evidence.key_visual_moment}`;
  }).join("\n\n");

  return `# ${data.title}

## Logline
${lead?.name || "The protagonist"} is pushed through ${data.tone || data.genre.join(" / ")} pressure as ${centralLocation} becomes the story's main proving ground, turning ${data.themes[0]?.toLowerCase() || "the central conflict"} into visible production choices.

## Taglines
- ${data.themes[0] || data.tone}
- The world decides what the hero must become.
- Every location has a political cost.
- Survival is a design language.
- The smallest object can carry the largest fate.

## Synopsis
${data.title} opens with ${data.scenes[0].key_visual_moment} From there, the script follows ${lead?.name || "its lead character"} through a widening chain of locations, power structures, and physical tests. The clearest early production signal is Scene ${firstSetPiece.scene_number}: ${firstSetPiece.key_visual_moment}

The production shape is defined by contrast: ${centralLocation} carries the most scene weight, while the story keeps expanding through exterior pressure, ceremonial interiors, combat work, and hero objects. The final movement lands on Scene ${lastScene.scene_number}: ${lastScene.key_visual_moment}

## Film Identity
- **Genre:** ${data.genre.join(" / ")}
- **Period:** ${data.setting_period}
- **Tone:** ${data.tone}
- **Core engine:** ${lead?.arc_summary || data.themes.join(", ")}
- **Production read:** ${locationCount} major locations, ${stuntScenes} stunt/VFX scenes, and hero props that need to remain legible across action, ritual, and character beats.

## Themes
${themeLines}

## Scope / Production Read
- **Scenes:** ${data.scenes.length}
- **Locations:** ${locationCount}
- **Exterior Scenes:** ${extScenes}
- **Night / Continuous Scenes:** ${nightScenes}
- **VFX / Stunt Scenes:** ${stuntScenes}
- **Hero Props:** ${data.props_master.length}
- **Hero prop focus:** ${heroProps.map((prop) => prop.item).join(", ") || "No hero props flagged"}
- **Complexity:** ${stuntScenes >= data.scenes.length / 2 ? "High" : "Medium"} scope. The deck should foreground logistics, physical staging, and continuity because the script repeatedly ties emotional turns to practical objects, locations, and movement.`;
}

function buildMoodDocument(data) {
  const desertOrScale = /sci-fi|action/i.test(data.genre.join(" ")) || /epic|desert|bleak/i.test(data.tone);
  const references = desertOrScale
    ? [
        ["Lawrence of Arabia (1962)", "Monumental desert scale and small human figures overwhelmed by landscape."],
        ["2001: A Space Odyssey (1968)", "Ritual pacing, architectural silence, and cosmic dread without visual clutter."],
        ["Mad Max: Fury Road (2015)", "Desert action where vehicles, bodies, and weather become one production system."],
        ["Arrival (2016)", "Austere science-fiction awe with emotional restraint and clean visual grammar."],
        ["Apocalypse Now (1979)", "Imperial machinery, ceremonial violence, and a descent into political madness."],
      ]
    : [
        ["Rosemary's Baby (1968)", "Ordinary hospitality becomes a conspiracy, useful for slow spatial threat."],
        ["The Conversation (1974)", "Suspicion, surveillance, and sound as evidence."],
        ["Eyes Wide Shut (1999)", "Ritual, wealth, and coded social performance create dread without overt monsters."],
        ["Night of the Living Dead (1968)", "Contained survival pressure with social stakes."],
        ["Parasite (2019)", "Architecture and class pressure shape every character choice."],
      ];
  const palette = desertOrScale
    ? [
        ["Spice Ochre", "#C88935", "Arrakis dust, spice light, and the constant heat surrounding desert scenes."],
        ["Caladan Slate", "#3D4652", "Rain, stone, and the cold inheritance of House Atreides."],
        ["Atreides Black", "#111513", "Armor, ceremony, and the noble severity of the family's military world."],
        ["Crysknife Bone", "#D9D0BC", "Fremen material culture and the pale threat of sacred objects."],
        ["Harkonnen Smoke", "#4A4642", "Steam baths, suspensors, poison gas, and industrial brutality."],
      ]
    : [
        ["Shadow Black", "#151515", "The negative space around the story's threat."],
        ["Domestic Cream", "#E6DDC9", "Soft surfaces that hide pressure."],
        ["Cold Blue", "#7F9BB2", "Clinical distance and emotional control."],
        ["Blood Red", "#9C1B22", "Moments where bodily cost breaks through."],
        ["Ground Green", "#3E5335", "Exterior calm that can turn hostile."],
      ];

  return `# Mood & Tone: ${data.title}

## Atmosphere
The film should feel ${data.tone || "controlled and cinematic"}: large enough to make the characters look politically small, but intimate enough that every object and gesture can alter fate. Scene ${data.scenes[0].scene_number} establishes the dream pressure with ${data.scenes[0].key_visual_moment} Scene ${data.scenes.at(-1).scene_number} closes the movement with ${data.scenes.at(-1).key_visual_moment}

## Tonal Descriptors
${[
  data.tone,
  "ceremonial pressure",
  "landscape as threat",
  "political machinery",
  "controlled awe",
  "ancestral burden",
  "ritual violence",
  "survival discipline",
  "prophetic unease",
  "material restraint",
].filter(Boolean).join(" · ")}

## Reference Points
${references.map(([title, note]) => `- **${title}** - ${note}`).join("\n")}

## Music & Sound Direction
Sound should make power feel physical. The Voice in Scene 3 needs unnatural authority without becoming cartoonish. The Atreides bagpipes in Scene 11 should announce military identity, while the Sardaukar ritual in Scene 14 should feel like state violence converted into liturgy. Desert scenes need wind, sand, machinery, and low human presence to compete with the scale.

### Soundtrack References
- **Sicario (2015)** - Low-frequency dread and disciplined escalation.
- **Arrival (2016)** - Vocal texture and awe without decorative excess.
- **The Thin Red Line (1998)** - War, prayer, and landscape held in one sonic field.
- **Mad Max: Fury Road (2015)** - Percussive machinery and action rhythm tied to geography.

## Color Palette
${palette.map(([name, hex, note]) => `- **${name}** \`${hex}\` - ${note}`).join("\n")}

## Similar Moods
${references.slice(0, 5).map(([title, note]) => `- **${title}** - ${note}`).join("\n")}`;
}

function buildSceneDocument(data) {
  const intScenes = countScenes(data, (scene) => scene.int_ext.includes("INT"));
  const extScenes = countScenes(data, (scene) => scene.int_ext.includes("EXT"));
  const nightScenes = countScenes(data, (scene) => /NIGHT|CONTINUOUS/i.test(scene.time_of_day));
  const stuntScenes = countScenes(data, (scene) => scene.vfx_stunts.length > 0);
  const header = `# Scene Breakdown: ${data.title}

- **Total Scenes:** ${data.scenes.length}
- **INT Scenes:** ${intScenes}
- **EXT Scenes:** ${extScenes}
- **Night / Continuous Scenes:** ${nightScenes}
- **Scenes With Stunts or VFX:** ${stuntScenes}
- **Primary Location:** ${topBySceneCount(data.locations, "scenes", 1)[0]?.name || "N/A"}

`;

  const sceneBlocks = data.scenes.map((scene) => `### Scene ${scene.scene_number}: ${scene.slug_line}
- **Pages:** ${scene.page_start}-${scene.page_end}
- **Location:** ${titleCase(scene.location)}
- **Time:** ${titleCase(scene.time_of_day)}
- **Characters:** ${list(scene.characters_present)}
- **Key Visual Moment:** ${scene.key_visual_moment}
- **Emotional Beat:** ${titleCase(scene.emotional_beat)}
- **Props:** ${list(scene.props)}
- **Wardrobe:** ${list(scene.wardrobe_notes, "Standard")}
- **VFX/Stunts:** ${list(scene.vfx_stunts)}
- **Notes:** ${sentence(scene.notes)}`).join("\n\n");

  return `${header}${sceneBlocks}

---

## Summary Statistics
- Total scenes: ${data.scenes.length}
- INT scenes: ${intScenes}
- EXT scenes: ${extScenes}
- Night / continuous scenes: ${nightScenes}
- Scenes with VFX/Stunts: ${stuntScenes}`;
}

function getLighting(scene) {
  if (/NIGHT|CONTINUOUS/i.test(scene.time_of_day)) {
    return "Low-key practical light, visible silhouettes, and enough environmental detail to keep geography clear.";
  }
  if (/MORNING|AFTERNOON|DAY/i.test(scene.time_of_day)) {
    return "Hard natural light with restrained contrast, making costume, object, and location continuity easy to read.";
  }
  return "Practical motivated light with restrained contrast.";
}

function buildStoryboardDocument(data) {
  const intro = `# Storyboard Prompts: ${data.title}

Each frame is grounded in the supplied scene data and written as a production-use image brief.

## Act 1: Arrival and Suspicion

`;

  const scenes = data.scenes.map((scene) => `### Scene ${scene.scene_number}: ${scene.slug_line}

**Prompt:** ${scene.key_visual_moment} Set the frame in ${scene.location}, with ${list(scene.characters_present).toLowerCase()} present. The image should feel like ${scene.emotional_beat}, with visible production details from the scene: ${list(scene.props.concat(scene.wardrobe_notes), "the room, bodies, and practical objects that create tension")}. Keep the frame cinematic, disciplined, and grounded in the supplied screenplay details. Do not add plot events, characters, creatures, or production history not present in the JSON.

**Camera:** ${scene.int_ext === "EXT" ? "Wide or medium-wide coverage that lets the location pressure the character" : "Controlled medium shot with tight blocking and visible object continuity"}
**Lighting:** ${getLighting(scene)}
**Mood:** ${titleCase(scene.emotional_beat)}
`).join("\n---\n\n");

  return `${intro}${scenes}`;
}

function buildPosterDocument(data) {
  const lead = topBySceneCount(data.characters, "scenes_present", 1)[0];
  const supporting = topBySceneCount(data.characters, "scenes_present", 4).filter((character) => character.name !== lead?.name);
  const heroProps = data.props_master.filter((prop) => prop.hero_prop);
  const majorScenes = [...data.scenes].sort((a, b) => (b.page_end - b.page_start) - (a.page_end - a.page_start)).slice(0, 3);
  const palette = [
    ["Spice Ochre", "#C88935"],
    ["Deep Black", "#111513"],
    ["Bone White", "#D9D0BC"],
    ["Smoke Gray", "#4A4642"],
    ["Blood Rust", "#8B3F24"],
  ];

  return `# Poster Concepts: ${data.title}

## About This Document
These are key-art directions for a campaign designer. Each concept should read at thumbnail size and stay attached to specific script evidence.

---

## Category: Character-Driven

**Concept 1: The Heir Against the Desert**
- **Style:** Monumental character one-sheet
- **Composition:** ${lead?.name || "The lead"} small against a vast landscape, with the key visual pressure from Scene ${data.scenes[0].scene_number}: ${data.scenes[0].key_visual_moment}
- **Color Palette:** ${palette.slice(0, 4).map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Tall, restrained serif title with wide-set sans-serif credits.
- **Tagline:** "The future is not waiting."
- **Mood:** Prophetic, isolated, immense
- **Target Appeal:** Viewers drawn to epic scale and character destiny.
- **AI Prompt:** A restrained epic film poster for ${data.title}, ${lead?.name || "the lead character"} isolated against the dominant landscape, ceremonial scale, hard light, ${data.tone}, no invented characters or plot details.

**Concept 2: The House Under Pressure**
- **Style:** Ensemble political poster
- **Composition:** ${[lead, ...supporting].filter(Boolean).map((character) => character.name).join(", ")} arranged as a formal power structure, with the primary location ${topBySceneCount(data.locations, "scenes", 1)[0]?.name || "the central location"} implied behind them.
- **Color Palette:** ${palette.map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Architectural, quiet, and ceremonial.
- **Tagline:** "Power changes hands."
- **Mood:** Formal, tense, inevitable
- **Target Appeal:** Viewers interested in political stakes and ensemble drama.
- **AI Prompt:** Ensemble key art for ${data.title}, formal arrangement of the major characters, political tension, monumental architecture and landscape, controlled color, premium science-fiction drama.

## Category: Symbolic / Metaphorical

**Concept 3: The Hero Object**
- **Style:** Minimal object poster
- **Composition:** ${heroProps[0]?.item || "The central hero prop"} isolated at large scale, treated as a sacred production object with scene evidence from ${heroProps[0]?.scenes?.join(", ") || "the script"}.
- **Color Palette:** ${palette.slice(1, 4).map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Small title, lots of negative space, no decorative texture unless tied to the object.
- **Tagline:** "A symbol can become a weapon."
- **Mood:** Ritual, precise, ominous
- **Target Appeal:** Viewers who respond to iconic film objects and design detail.
- **AI Prompt:** Minimalist poster for ${data.title}, ${heroProps[0]?.item || "central hero object"} isolated with premium lighting, ritual importance, restrained negative space, no unrelated props.

**Concept 4: The Landscape as Fate**
- **Style:** Environmental metaphor poster
- **Composition:** A vast location field from ${topBySceneCount(data.locations, "scenes", 1)[0]?.name || "the main location"} overwhelms a small human silhouette, with weather, architecture, or terrain carrying the story's pressure.
- **Color Palette:** ${palette.map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Title embedded low in the environment so scale reads first.
- **Tagline:** "The world chooses its shape."
- **Mood:** Immense, quiet, fatalistic
- **Target Appeal:** Premium sci-fi and design-forward audiences.
- **AI Prompt:** Environmental one-sheet for ${data.title}, tiny human figure against an overwhelming location from the screenplay, hard light, epic restraint, graphic readability at thumbnail size.

## Category: Scene-Based

${majorScenes.map((scene, index) => `**Concept ${index + 5}: Scene ${scene.scene_number} Signal**
- **Style:** Scene-led campaign image
- **Composition:** ${scene.key_visual_moment}
- **Color Palette:** ${palette.slice(index, index + 3).map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Title clear at thumbnail size, secondary copy minimal.
- **Tagline:** "${index === 0 ? "Scale has teeth." : index === 1 ? "The test is already underway." : "No inheritance is clean."}"
- **Mood:** ${titleCase(scene.emotional_beat)}
- **Target Appeal:** Viewers who want one memorable set piece as the campaign hook.
- **AI Prompt:** Key art for ${data.title}, Scene ${scene.scene_number}: ${scene.key_visual_moment} Keep only characters and objects named in the script data, cinematic scale, no extra plot details.`).join("\n\n")}

## Category: Minimalist / Typographic

**Concept 8: The Title as Terrain**
- **Style:** Typographic conceptual poster
- **Composition:** The title treated like an enormous piece of landscape or architecture, with a small figure moving through the letterforms.
- **Color Palette:** ${palette.slice(0, 3).map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Massive serif or chiseled sans-serif, quiet spacing, no distressed effects.
- **Tagline:** "A world inside a name."
- **Mood:** Iconic, austere, memorable
- **Target Appeal:** Design-forward genre audience.
- **AI Prompt:** Minimal typographic poster for ${data.title}, title as monumental terrain, tiny human silhouette, austere premium science-fiction design, controlled palette.

**Concept 9: The Production Map**
- **Style:** Production-design one-sheet
- **Composition:** A restrained map of ${data.locations.slice(0, 4).map((location) => location.name).join(", ")}, with one object or event marker per location.
- **Color Palette:** ${palette.map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Information-design clarity with cinematic restraint.
- **Tagline:** "Every place has a cost."
- **Mood:** Designed, strategic, expansive
- **Target Appeal:** Viewers interested in puzzle-box horror and production design.
- **AI Prompt:** Elegant production-map poster for ${data.title}, restrained map of the script's major locations with small hero-object markers, premium campaign design, no invented geography.`;
}

function parseStoryboardPrompts(markdown) {
  const scenes = [];
  const lines = markdown.split("\n");
  let current = null;
  let promptBuffer = [];
  let collectingPrompt = false;

  const flush = () => {
    if (!current) return;
    if (collectingPrompt) current.prompt = promptBuffer.join("\n").trim();
    scenes.push(current);
  };

  for (const line of lines) {
    const sceneMatch = line.match(/^### Scene (\d+):\s*(.+)/);
    if (sceneMatch) {
      flush();
      current = {
        number: Number(sceneMatch[1]),
        slugLine: sceneMatch[2].trim(),
        prompt: "",
        camera: "",
      };
      promptBuffer = [];
      collectingPrompt = false;
      continue;
    }

    if (!current) continue;

    const promptMatch = line.match(/^\*\*Prompt:\*\*\s*(.*)/);
    if (promptMatch) {
      collectingPrompt = true;
      promptBuffer = promptMatch[1] ? [promptMatch[1].trim()] : [];
      continue;
    }

    const cameraMatch = line.match(/\*\*Camera:\*\*\s*(.+)/);
    if (cameraMatch) {
      if (collectingPrompt) {
        current.prompt = promptBuffer.join("\n").trim();
        collectingPrompt = false;
      }
      current.camera = cameraMatch[1].trim();
      continue;
    }

    if (/^\*\*(Lighting|Mood):\*\*/.test(line)) {
      collectingPrompt = false;
      continue;
    }

    if (collectingPrompt) promptBuffer.push(line);
  }

  flush();
  return scenes.filter((scene) => scene.prompt);
}

function parsePosterConcepts(markdown) {
  const concepts = [];
  const lines = markdown.split("\n");
  let current = null;

  const flush = () => {
    if (current) concepts.push(current);
    current = null;
  };

  for (const line of lines) {
    const conceptMatch = line.match(/\*\*Concept (\d+):\s*(.+?)\*\*/);
    if (conceptMatch) {
      flush();
      current = {
        number: Number(conceptMatch[1]),
        name: conceptMatch[2].trim(),
        composition: "",
        style: "",
      };
      continue;
    }

    if (!current) continue;

    const fieldMatch = line.match(/^- \*\*(.+?):\*\*\s*(.+)/);
    if (!fieldMatch) continue;

    const key = fieldMatch[1].toLowerCase();
    const value = fieldMatch[2].trim();
    if (key === "composition") current.composition = value;
    if (key === "style") current.style = value;
  }

  flush();
  return concepts.filter((concept) => concept.composition || concept.style);
}

async function downloadImage(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image download failed with HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destination, buffer);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function directoryHasFiles(directory) {
  try {
    const entries = await readdir(directory);
    return entries.length > 0;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function runWithConcurrency(items, concurrency, runner) {
  const results = [];
  let index = 0;
  let completed = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      const item = items[currentIndex];
      const result = await runner(item, currentIndex);
      results[currentIndex] = result;
      completed += 1;
      log(`Images ${completed}/${items.length}: ${item.label}`);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

async function generateImageWithRetry(baseUrl, route, body, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await postJson(baseUrl, route, body);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
      }
    }
  }
  throw lastError;
}

async function generateImages({ baseUrl, data, documents, slug, imageMode }) {
  const publicDir = path.join(process.cwd(), "public", "demo-images", slug);

  if (imageMode === "fresh" && await directoryHasFiles(publicDir)) {
    throw new Error(
      [
        `Image folder already has files: ${publicDir}`,
        "Move it into _archived/ first, or rerun with --force-images to overwrite, or --reuse-images to resume.",
      ].join("\n"),
    );
  }

  await mkdir(publicDir, { recursive: true });

  const storyboardDoc = documents.find((document) => document.slug === "storyboard-prompts");
  const posterDoc = documents.find((document) => document.slug === "poster-concepts");
  const storyboardScenes = storyboardDoc?.content ? parseStoryboardPrompts(storyboardDoc.content) : [];
  const posterConcepts = posterDoc?.content ? parsePosterConcepts(posterDoc.content) : [];

  const tasks = [
    ...data.characters.map((character) => ({
      kind: "portrait",
      key: character.name,
      label: `portrait:${character.name}`,
      route: "/api/generate-portrait",
      body: {
        name: character.name,
        description: character.description,
        apiKey: "",
      },
      file: `portrait-${slugify(character.name)}.jpg`,
    })),
    ...data.props_master.map((prop) => ({
      kind: "prop",
      key: prop.item,
      label: `prop:${prop.item}`,
      route: "/api/generate-prop",
      body: {
        name: prop.item,
        notes: prop.notes,
        apiKey: "",
      },
      file: `prop-${slugify(prop.item)}.jpg`,
    })),
    ...storyboardScenes.map((scene) => ({
      kind: "storyboard",
      key: scene.number,
      label: `storyboard:${scene.number}`,
      route: "/api/generate-image",
      body: {
        prompt: scene.prompt,
        camera: scene.camera,
        apiKey: "",
      },
      file: `storyboard-${scene.number}.jpg`,
    })),
    ...posterConcepts.map((concept) => ({
      kind: "poster",
      key: concept.number,
      label: `poster:${concept.number}`,
      route: "/api/generate-poster-image",
      body: {
        prompt: [concept.composition, concept.style ? `Style: ${concept.style}.` : ""]
          .filter(Boolean)
          .join(" "),
        apiKey: "",
      },
      file: `poster-${concept.number}.jpg`,
    })),
  ];

  log(`Generating ${tasks.length} images at concurrency ${MAX_IMAGE_CONCURRENCY}...`);

  const imageResults = await runWithConcurrency(tasks, MAX_IMAGE_CONCURRENCY, async (task) => {
    const destination = path.join(publicDir, task.file);
    const localUrl = `/demo-images/${slug}/${task.file}`;

    if (imageMode === "reuse" && await fileExists(destination)) {
      return {
        ...task,
        url: localUrl,
      };
    }

    const payload = await generateImageWithRetry(baseUrl, task.route, task.body);
    await downloadImage(payload.url, destination);
    return {
      ...task,
      url: localUrl,
    };
  });

  const images = {};
  const posterImages = {};
  const portraits = {};
  const propImages = {};

  for (const image of imageResults) {
    const saved = { status: "done", url: image.url };
    if (image.kind === "storyboard") images[image.key] = saved;
    if (image.kind === "poster") posterImages[image.key] = saved;
    if (image.kind === "portrait") portraits[image.key] = saved;
    if (image.kind === "prop") propImages[image.key] = saved;
  }

  return { images, posterImages, portraits, propImages };
}

async function writeDemoModule({ data, jsonData, documents, images, slug, exportName }) {
  const demoDir = path.join(process.cwd(), "lib", "demos");
  await mkdir(demoDir, { recursive: true });

  const project = {
    title: data.title,
    createdAt: new Date().toISOString(),
    jsonData,
    documents,
    ...images,
  };

  const content = `// Auto-generated by prompt-tests/scripts/build-demo-fixture.mjs.
// Image URLs point to committed files in public/demo-images/${slug}/.

import type { SavedProject } from "../reports";

export const ${exportName}: SavedProject = ${JSON.stringify(project, null, 2)};
`;

  await writeFile(path.join(demoDir, `${slug}.ts`), content);
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const positional = args.filter((arg) => !arg.startsWith("--"));
  const [inputPath, slug, exportName] = positional;
  if (!inputPath || !slug || !exportName) usage();
  if (positional.length !== 3) usage();
  if (flags.has("--force-images") && flags.has("--reuse-images")) usage();

  const unknownFlags = [...flags].filter((flag) => !["--force-images", "--reuse-images"].includes(flag));
  if (unknownFlags.length > 0) usage();

  const imageMode = flags.has("--force-images") ? "force" : flags.has("--reuse-images") ? "reuse" : "fresh";

  const baseUrl = process.env.GREENLIGHT_BASE_URL || DEFAULT_BASE_URL;
  const rawJsonData = await readFile(inputPath, "utf8");
  const data = normalizeData(JSON.parse(rawJsonData), slug);
  const jsonData = JSON.stringify(data, null, 2);
  validateScreenplayData(data);

  log(`Building demo fixture for ${data.title} from ${inputPath}`);
  log(`Using ${baseUrl}`);
  log(`Image mode: ${imageMode}`);

  const documents = await generateDocuments({ baseUrl, jsonData });
  const images = await generateImages({ baseUrl, data, documents, slug, imageMode });
  await writeDemoModule({ data, jsonData, documents, images, slug, exportName });

  log(`Done: lib/demos/${slug}.ts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
