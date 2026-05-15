#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
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
    "Usage: node prompt-tests/scripts/build-demo-fixture.mjs <input-json> <slug> <export-name>",
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

  return `# ${data.title}

## Logline
A photographer's weekend visit to his girlfriend's family estate turns from polite discomfort into a body-horror escape story, as every friendly gesture reveals another system built to capture him.

## Taglines
- Smile for the family.
- The invitation is the trap.
- Every room has been waiting for him.
- The flash is the warning.
- Get out before politeness becomes paralysis.

## Synopsis
${data.title} starts with Andre being hunted on a suburban street, then shifts into Chris Washington's uneasy trip from his city apartment into the Armitage estate. The film's pressure comes from social surfaces that keep changing meaning: Rose defending Chris from Officer Ryan, Dean over-explaining Jesse Owens, Georgina over-pouring iced tea, Jeremy turning dinner into a physical threat, and Missy's teacup turning conversation into control.

The production shape is deceptively contained. Most of the story concentrates inside and around the ${centralLocation}, but the script keeps changing what that house is: welcoming family home, party venue, hypnosis chamber, auction floor, games room prison, and escape maze. That makes the design problem less about scale and more about precision. Every prop and room has to look normal before it becomes evidence.

## Film Identity
- **Genre:** ${data.genre.join(" / ")}
- **Period:** ${data.setting_period}
- **Tone:** ${data.tone}
- **Core engine:** Racial microaggressions accumulate until they become literal captivity.
- **Production read:** One primary estate, many tonal turns, heavy performance control, and a final run of close-quarter violence.

## Themes
**Performative allyship**
Dean's porch hug in Scene 8, the Jesse Owens photo in Scene 9, and the party questions in Scene 15 all present friendliness as a performance Chris is forced to manage.

**The body as property**
The silent auction in Scene 18 makes literal what the party has been doing socially: measuring Chris, admiring him, and treating his body as transferable value.

**Control through comfort**
Missy's office, the teacup, the dining room, Rose's bedroom, and the games room are ordinary domestic spaces until the script reveals how carefully they have been weaponized.

**Seeing as survival**
Chris's camera is not just characterization. The phone flash in Scene 17 breaks Andre's conditioning, turning image-making into a survival mechanism.

## Scope / Production Read
- **Scenes:** ${data.scenes.length}
- **Locations:** ${locationCount}
- **Exterior Scenes:** ${extScenes}
- **Night / Continuous Scenes:** ${nightScenes}
- **VFX / Stunt Scenes:** ${stuntScenes}
- **Hero Props:** ${data.props_master.length}
- **Complexity:** Medium footprint, high precision. The estate does most of the work, but hypnosis, crash work, gun work, fight beats, blood FX, and image continuity make it more complex than a single-location thriller.`;
}

function buildMoodDocument(data) {
  return `# Mood & Tone: ${data.title}

## Atmosphere
The film should feel like a sunny social visit with a trapdoor underneath it. Daylight does not make the estate safe; it makes the danger harder for Chris to call out. The mood moves from suburban dread in Scenes 1-3, to awkward domestic performance in Scenes 8-12, to full ritual horror once the flash reveals Andre in Scene 17 and the auction in Scene 18 reframes the party.

## Tonal Descriptors
polite dread · sunlit captivity · social horror · clinical domesticity · predatory hospitality · satirical unease · body-theft paranoia · controlled panic · suburban ritual · flash-bulb rupture

## Reference Points
- **Rosemary's Baby (1968)** — Ordinary apartment hospitality becomes a conspiracy, useful for the slow conversion of domestic spaces into threat.
- **The Stepford Wives (1975)** — The perfect community surface masks body-control horror and social compliance.
- **Eyes Wide Shut (1999)** — Party ritual, wealth, and coded social performance create dread without needing overt monsters.
- **Rear Window (1954)** — Chris's camera and looking/being-looked-at dynamic make observation part of the suspense language.
- **Night of the Living Dead (1968)** — A Black protagonist trapped in a house under siege gives the ending an extra layer of social terror.

## Music & Sound Direction
Sound should treat control as small, repeatable cues. The opening car uses "Run Rabbit Run" as a predator's private joke. Missy's teacup and spoon need to be mixed like a weapon: tiny, clean, rhythmic, and more powerful than any score swell. The party can stay airy and social, but Chris's isolation should be audible through dropped room tone, over-clear voices, camera flash silence, and the sudden pressure of hypnosis.

### Soundtrack References
- **Under the Skin (2013)** — Mica Levi — Predatory repetition and bodily unease without conventional horror release.
- **The Conversation (1974)** — David Shire — Surveillance, interior suspicion, and sound as evidence.
- **Rosemary's Baby (1968)** — Krzysztof Komeda — Lullaby sweetness with a poisoned domestic edge.
- **Psycho (1960)** — Bernard Herrmann — Sharp rhythmic attack for moments where politeness breaks into violence.

## Color Palette
- **Camera Black** \`#151515\` — Chris's photographic eye, the phone screen, the games room, and the darkness of the Sunken Place.
- **Estate Cream** \`#E6DDC9\` — The Armitage home's polite walls, porch daylight, and the soft domestic cover for violence.
- **Teacup Blue** \`#7F9BB2\` — Missy's hypnosis object and the cold clinical calm of her office.
- **Blood Flash Red** \`#9C1B22\` — Nosebleed, gunshot, Rose's wound, and every moment the body's real cost breaks through.
- **Lawn Green** \`#3E5335\` — The estate grounds, Walter's labor, the party lawn, and the false pastoral calm around the house.

## Similar Moods
- **Parasite (2019)** — Wealth, architecture, and politeness become mechanisms of social violence.
- **The Invitation (2015)** — A social gathering turns into a trap by asking the protagonist to keep accepting discomfort.
- **It Follows (2014)** — Suburban space and everyday behavior acquire a clean, inescapable menace.
- **Caché (2005)** — The act of looking becomes morally unstable and dangerous.
- **The Stepford Wives (1975)** — Community normalcy hides ownership and replacement horror.`;
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
    return "Low-key night light with practical sources, pockets of darkness, and clean horror contrast.";
  }
  if (/MORNING|AFTERNOON|DAY/i.test(scene.time_of_day)) {
    return "Natural daylight that feels plausible and slightly too clear, letting social discomfort sit in the open.";
  }
  return "Practical motivated light with restrained contrast.";
}

function buildStoryboardDocument(data) {
  const intro = `# Storyboard Prompts: ${data.title}

Each frame is grounded in the supplied scene data and written as a production-use image brief.

## Act 1: Arrival and Suspicion

`;

  const scenes = data.scenes.map((scene) => `### Scene ${scene.scene_number}: ${scene.slug_line}

**Prompt:** ${scene.key_visual_moment} Set the frame in ${scene.location}, with ${list(scene.characters_present).toLowerCase()} present. The image should feel like ${scene.emotional_beat}, with visible production details from the scene: ${list(scene.props.concat(scene.wardrobe_notes), "the room, bodies, and practical objects that create tension")}. Keep the style cinematic, restrained, contemporary psychological horror, grounded in real locations, no fantasy monsters, no extra plot details.

**Camera:** ${scene.int_ext === "EXT" ? "Wide or medium-wide coverage that lets the location pressure the character" : "Controlled medium shot with tight blocking and visible object continuity"}
**Lighting:** ${getLighting(scene)}
**Mood:** ${titleCase(scene.emotional_beat)}
`).join("\n---\n\n");

  return `${intro}${scenes}`;
}

function buildPosterDocument(data) {
  return `# Poster Concepts: ${data.title}

## About This Document
These are key-art directions for a campaign designer. Each concept should read at thumbnail size and stay attached to specific script evidence.

---

## Category: Character-Driven

**Concept 1: The Photographer in the Chair**
- **Style:** Psychological horror portrait, restrained one-sheet
- **Composition:** Chris centered in Missy's armchair, camera-black negative space around him, tears catching one hard highlight as the room drops away into the Sunken Place.
- **Color Palette:** #151515 (Camera Black), #7F9BB2 (Teacup Blue), #E6DDC9 (Estate Cream), #9C1B22 (Blood Flash Red)
- **Typography:** Small white sans-serif title locked low, wide tracking, no distressed horror lettering.
- **Tagline:** "The visit is the trap."
- **Mood:** Paralyzed, intimate, controlled
- **Target Appeal:** Elevated horror viewers who want social dread over monster imagery.
- **AI Prompt:** A restrained psychological horror movie poster for Get Out, Chris Washington frozen in an armchair, tears on his face, falling into a black void like the Sunken Place, a pale teacup glinting in the foreground, elegant minimal typography, black cream blue and blood red palette, cinematic but not gory.

**Concept 2: Rose at the Door**
- **Style:** Character betrayal poster
- **Composition:** Rose framed in the foyer holding car keys, soft estate light behind her, Chris only reflected as a dark shape in the door glass.
- **Color Palette:** #E6DDC9 (Estate Cream), #151515 (Camera Black), #3E5335 (Lawn Green), #9C1B22 (Blood Flash Red)
- **Typography:** Clean editorial serif for title with a thin sans-serif tagline.
- **Tagline:** "She brought him home."
- **Mood:** Romantic surface, predatory reveal
- **Target Appeal:** Thriller audience drawn to relationship betrayal and hidden villainy.
- **AI Prompt:** Movie poster, Rose stands in a grand house foyer holding car keys, calm smile, Chris reflected as a shadow in glass behind her, warm estate lighting hiding danger, elegant psychological thriller composition, no spoilers beyond betrayal mood.

## Category: Symbolic / Metaphorical

**Concept 3: The Teacup Trigger**
- **Style:** Object-first minimalist horror
- **Composition:** A porcelain teacup and spoon on a dark table, ripples inside the cup forming a small falling human silhouette.
- **Color Palette:** #7F9BB2 (Teacup Blue), #151515 (Camera Black), #E6DDC9 (Estate Cream)
- **Typography:** Tiny title above the cup, lots of negative space.
- **Tagline:** "One sound. No escape."
- **Mood:** Clinical, hypnotic, precise
- **Target Appeal:** Viewers who respond to iconic horror objects.
- **AI Prompt:** Minimalist horror one-sheet, porcelain teacup and silver spoon on a dark table, concentric ripples inside the tea becoming a falling human silhouette, elegant negative space, restrained typography, psychological horror.

**Concept 4: The Flash**
- **Style:** High-contrast graphic key art
- **Composition:** A camera flash exploding from Chris's phone, briefly revealing Andre's terrified face inside a clean party silhouette.
- **Color Palette:** #151515 (Camera Black), #F5F2E8 (Flash White), #9C1B22 (Blood Flash Red), #3E5335 (Lawn Green)
- **Typography:** Title cut by the flash line, readable at small size.
- **Tagline:** "Seeing is survival."
- **Mood:** Sudden, electric, warning
- **Target Appeal:** Genre fans who remember one clear visual hook.
- **AI Prompt:** Graphic horror poster, smartphone camera flash blasts across a garden party scene, revealing a terrified man's face breaking through a polite mask, sharp white flash, black background, green lawn hints, red nosebleed detail, clean modern typography.

## Category: Scene-Based

**Concept 5: The Silent Auction**
- **Style:** Ritual social horror tableau
- **Composition:** Dean standing beside an easel with Chris's portrait, guests arranged like a polite congregation, hands mid-bid but mouths closed.
- **Color Palette:** #E6DDC9 (Estate Cream), #3E5335 (Lawn Green), #151515 (Camera Black), #9C1B22 (Blood Flash Red)
- **Typography:** Stately serif title, almost like a gallery placard.
- **Tagline:** "Some bids are made in silence."
- **Mood:** Wealthy, ritualistic, sickening
- **Target Appeal:** Audiences drawn to social satire and conspiracy horror.
- **AI Prompt:** Social horror movie poster, elegant garden party silent auction, older wealthy guests silently bidding, an easel displays a portrait of Chris Washington, sunny lawn becomes ritual space, unsettling symmetry, refined gallery-like typography.

**Concept 6: Suburban Opening**
- **Style:** Night-street suspense poster
- **Composition:** Andre small in the frame on an empty suburban street, a cream sports car creeping behind him, the title floating above like a warning sign.
- **Color Palette:** #151515 (Camera Black), #E6DDC9 (Estate Cream), #7F9BB2 (Streetlight Blue), #9C1B22 (Blood Flash Red)
- **Typography:** Sans-serif all caps, small and cold.
- **Tagline:** "The wrong street knows your name."
- **Mood:** Predatory, quiet, inevitable
- **Target Appeal:** Suspense audience entering through the kidnapping hook.
- **AI Prompt:** Nighttime suburban horror poster, lone Black man walking down an empty street, vintage cream Porsche crawling behind him with tinted windows, cold streetlights, deep shadows, restrained modern title treatment, no gore.

## Category: Minimalist / Typographic

**Concept 7: Get Out / Sink In**
- **Style:** Typographic conceptual poster
- **Composition:** The words GET OUT at the top, a small human figure falling downward through the O into black negative space.
- **Color Palette:** #151515 (Camera Black), #F5F2E8 (Flash White), #7F9BB2 (Teacup Blue)
- **Typography:** Large bold sans-serif, minimal, architectural spacing.
- **Tagline:** "Sink in."
- **Mood:** Iconic, stark, memorable
- **Target Appeal:** Design-forward genre audience.
- **AI Prompt:** Minimal typographic movie poster, huge clean words GET OUT on black background, tiny human silhouette falling through the letter O into a deep void, elegant stark design, cream and blue highlights.

**Concept 8: The Estate Map**
- **Style:** Production-design one-sheet
- **Composition:** The Armitage estate seen as a clean architectural cutaway: porch, office, bedroom, games room, lawn, each room marked by one small object.
- **Color Palette:** #E6DDC9 (Estate Cream), #151515 (Camera Black), #3E5335 (Lawn Green), #9C1B22 (Blood Flash Red)
- **Typography:** Title as an estate brochure headline gone wrong.
- **Tagline:** "Every room has a purpose."
- **Mood:** Designed, sinister, controlled
- **Target Appeal:** Viewers interested in puzzle-box horror and production design.
- **AI Prompt:** Elegant horror poster showing a cutaway plan of a secluded family estate, rooms marked by a teacup, camera flash, shoebox photos, games room chair, and lawn auction easel, estate brochure design turned sinister, restrained colors, clean typography.`;
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

async function generateImages({ baseUrl, data, documents, slug }) {
  const publicDir = path.join(process.cwd(), "public", "demo-images", slug);
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

    if (await fileExists(destination)) {
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
  const [inputPath, slug, exportName] = process.argv.slice(2);
  if (!inputPath || !slug || !exportName) usage();

  const baseUrl = process.env.GREENLIGHT_BASE_URL || DEFAULT_BASE_URL;
  const jsonData = await readFile(inputPath, "utf8");
  const data = JSON.parse(jsonData);
  validateScreenplayData(data);

  log(`Building demo fixture for ${data.title} from ${inputPath}`);
  log(`Using ${baseUrl}`);

  const documents = await generateDocuments({ baseUrl, jsonData });
  const images = await generateImages({ baseUrl, data, documents, slug });
  await writeDemoModule({ data, jsonData, documents, images, slug, exportName });

  log(`Done: lib/demos/${slug}.ts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
