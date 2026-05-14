import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");
const RUNS_DIR = join(PROJECT_ROOT, "prompt-tests", "runs");
const CACHE_FILE = join(PROJECT_ROOT, "lib", "cached-projects.ts");
const TARGET_CACHE_KEY = "everything-everywhere-all-at-once";
const PROVIDER = process.env.GREENLIGHT_PROMPT_PROVIDER || "anthropic";
const MODEL =
  process.env.GREENLIGHT_PROMPT_MODEL ||
  (PROVIDER === "deepseek"
    ? "deepseek-chat"
    : PROVIDER === "codex"
      ? "codex-cli-default"
    : PROVIDER === "llm"
      ? "gpt-5.4"
      : "claude-haiku-4-5-20251001");
const API_KEY =
  PROVIDER === "codex"
    ? "codex-cli"
    : PROVIDER === "llm"
    ? "llm-cli"
    : PROVIDER === "deepseek"
      ? process.env.DEEPSEEK_API_KEY
      : process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  const keyName = PROVIDER === "deepseek" ? "DEEPSEEK_API_KEY" : "ANTHROPIC_API_KEY";
  console.error(`Missing ${keyName}. Export it before running npm run prompt:compare.`);
  process.exit(1);
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeMarkdown(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content.trimEnd() + "\n", "utf8");
}

function loadCachedProject() {
  const source = readFileSync(CACHE_FILE, "utf8");
  const match = source.match(
    /export const CACHED_PROJECTS: Record<string, SavedProject> = ([\s\S]*?);\s*\n\s*export function normalizeTitle/,
  );
  if (!match) {
    throw new Error("Could not find CACHED_PROJECTS object in lib/cached-projects.ts");
  }
  const cache = JSON.parse(match[1]);
  const project = cache[TARGET_CACHE_KEY];
  if (!project) {
    throw new Error(`Could not find cached project: ${TARGET_CACHE_KEY}`);
  }
  return project;
}

function getDoc(project, slug) {
  const doc = project.documents.find((d) => d.slug === slug && d.content);
  if (!doc) throw new Error(`Missing cached document: ${slug}`);
  return doc.content;
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
    return {
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
    };
  }
  if (role === "production") {
    return {
      ...identity,
      locations: data.locations,
      props_master: data.props_master,
      characters: data.characters,
      scenes: data.scenes.map((scene) => ({
        ...compactScene(scene),
        characters_present: undefined,
      })),
    };
  }
  if (role === "cast") {
    return {
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
    };
  }
  if (role === "mood") {
    return {
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
    };
  }
  if (role === "key-art") {
    return {
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
    };
  }
  return {
    ...identity,
    characters: data.characters,
    locations: data.locations,
    props_master: data.props_master,
    scenes: data.scenes.map(compactScene),
  };
}

function currentLocations(data) {
  const rows = data.locations.map((location) => {
    const scenes = (location.scenes || []).join(", ");
    const times = (location.time_variations || []).join(", ") || "Not specified";
    const requirements = (location.set_requirements || []).join("; ") || "None listed";
    return `### ${location.name}\n- **Scenes:** ${scenes}\n- **INT/EXT:** ${location.int_ext}\n- **Time variations:** ${times}\n- **Description:** ${location.description}\n- **Set requirements:** ${requirements}`;
  });
  return `# Locations: ${data.title}\n\n${rows.join("\n\n")}`;
}

function currentCast(data) {
  const rows = data.characters.map((character) => {
    return `### ${character.name}\n- **Description:** ${character.description}\n- **Arc:** ${character.arc_summary}\n- **Scenes:** ${(character.scenes_present || []).join(", ")}\n- **Special requirements:** ${(character.special_requirements || []).join("; ") || "None listed"}\n- **Wardrobe changes:** ${character.wardrobe_changes}`;
  });
  return `# Cast & Crew: ${data.title}\n\n${rows.join("\n\n")}`;
}

function currentProduction(data) {
  const props = data.props_master.map((prop) => {
    return `### ${prop.item}\n- **Scenes:** ${(prop.scenes || []).join(", ")}\n- **Hero prop:** ${prop.hero_prop ? "Yes" : "No"}\n- **Notes:** ${prop.notes || "None"}`;
  });
  const wardrobe = data.scenes
    .filter((scene) => scene.wardrobe_notes?.length)
    .map((scene) => `- **Scene ${scene.scene_number}:** ${scene.wardrobe_notes.join("; ")}`);
  return `# Production Design: ${data.title}\n\n## Props\n\n${props.join("\n\n")}\n\n## Wardrobe Notes\n\n${wardrobe.join("\n") || "No wardrobe notes listed."}`;
}

function currentTitleAndPalette(data, moodDoc) {
  const paletteMatch = moodDoc.match(/## Color Palette([\s\S]*?)(\n## |\n# |$)/);
  return `# Title & Palette: ${data.title}\n\n## Current Title Treatment Input\n\nThe current app derives this tab mostly from the title plus the Mood & Tone color palette.\n\n## Palette Source\n\n${paletteMatch ? paletteMatch[1].trim() : "No palette section found."}`;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function callClaude(prompt, input, maxTokens = 6000) {
  if (PROVIDER === "codex") {
    return callCodexCli(prompt, input);
  }
  if (PROVIDER === "llm") {
    return callLlmCli(prompt, input);
  }
  if (PROVIDER === "deepseek") {
    return callDeepSeek(prompt, input, maxTokens);
  }

  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nSCREENPLAY DATA:\n${JSON.stringify(input, null, 2)}`,
      },
    ],
  };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    if (response.status === 429 && attempt < 3) {
      await sleep(5000 * 2 ** attempt);
      continue;
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API ${response.status}: ${errorText.slice(0, 500)}`);
    }
    const data = await response.json();
    const text = data.content?.find((block) => block.type === "text")?.text;
    if (!text) throw new Error("Claude returned no text content");
    return text.trim();
  }
  throw new Error("Claude API retry limit exceeded");
}

async function callDeepSeek(prompt, input, maxTokens = 6000) {
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: `${prompt}\n\nSCREENPLAY DATA:\n${JSON.stringify(input, null, 2)}`,
      },
    ],
  };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (response.status === 429 && attempt < 3) {
      await sleep(5000 * 2 ** attempt);
      continue;
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API ${response.status}: ${errorText.slice(0, 500)}`);
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("DeepSeek returned no text content");
    return text.trim();
  }
  throw new Error("DeepSeek API retry limit exceeded");
}

function callLlmCli(prompt, input) {
  const fullPrompt = `${prompt}\n\nSCREENPLAY DATA:\n${JSON.stringify(input, null, 2)}`;
  const result = spawnSync("llm", ["-m", MODEL], {
    input: fullPrompt,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 24,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`llm CLI failed: ${result.stderr || result.stdout}`);
  }
  const text = result.stdout.trim();
  if (!text) throw new Error("llm CLI returned no text content");
  return text;
}

function callCodexCli(prompt, input) {
  const fullPrompt = `${prompt}\n\nSCREENPLAY DATA:\n${JSON.stringify(input, null, 2)}`;
  const tmp = mkdtempSync(join(tmpdir(), "greenlight-codex-"));
  const outputFile = join(tmp, "last-message.md");
  const result = spawnSync(
    "codex",
    [
      "-a",
      "never",
      "exec",
      "--cd",
      PROJECT_ROOT,
      "--sandbox",
      "read-only",
      "--output-last-message",
      outputFile,
      "-",
    ],
    {
      input: fullPrompt,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 24,
    },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`codex exec failed: ${result.stderr || result.stdout}`);
  }
  const text = existsSync(outputFile) ? readFileSync(outputFile, "utf8").trim() : "";
  if (!text) throw new Error("codex exec returned no final message");
  return text;
}

const groundingRules = `
Grounding rules:
- Every major section must cite concrete evidence from the JSON: scene numbers, locations, props, characters, emotional beats, or key visual moments.
- Do not use generic film-school adjectives unless tied to a specific scene detail.
- Do not invent plot facts, collaborators, budget, release strategy, production history, or external trivia.
- Write like a useful film collaborator, not a marketer.
- Output only clean markdown. No preamble.
`;

const rolePrompts = {
  creativeDirector: `${groundingRules}
You are the creative director on an early film vision deck. Write a concise synthesis that all departments can use.

Format:
# Creative Director Read
## Core Thesis
3-5 sentences on what the film is really about as a viewing experience.
## Recurring Anchors
5 bullets. Each names a recurring image, object, location, or emotional tension, with scene evidence.
## Department North Star
One short paragraph that tells every department what to protect.`,

  overview: `${groundingRules}
You are a 1st AD and line producer preparing the front page of a creative breakdown. Make the Overview more useful than a pitch synopsis.

Use this creative director context:
{{creativeDirector}}

Format:
# Overview: [Title]
## The Film In One Breath
One paragraph, maximum 120 words.
## Why This Film
What the film promises creatively and emotionally. Cite at least 3 scenes.
## Scope Read
Concrete production read: scene count, location pattern, night/exterior load, cast pressure, VFX/stunt burden.
## Hidden Complexity
5 bullets a producer or AD would flag early.
## Demo-Worthy Hook
One tight paragraph on what would make a creative team lean forward.`,

  mood: `${groundingRules}
You are a cinematographer reading the script before a director meeting. Improve Mood & Tone with visual grammar, not vague atmosphere.

Use this creative director context:
{{creativeDirector}}

Format:
# Mood & Tone: Cinematographer Pass
## Atmospheric Thesis
3 paragraphs. Cite scene evidence.
## Light Rules
5 rules for light, contrast, color temperature, or practical sources. Each must cite a scene.
## Camera Distance & Movement
Explain when the camera should be close, distant, still, chaotic, or withheld.
## Texture Map
List 6 textures or surfaces the film should keep returning to.
## Sound & Silence
What sonic behavior should support the visual grammar.
## What To Avoid
5 bullets that would make the film feel less specific.`,

  locations: `${groundingRules}
You are a location scout preparing a first-pass scout brief. Do not merely list locations. Explain what each place has to do emotionally and practically.

Use this creative director context:
{{creativeDirector}}

Format:
# Locations: Scout Pass
## Scout Thesis
One paragraph on how locations tell the story.
## Location System
Group locations by story function, not alphabetically.
## Priority Scout Briefs
For the 8-12 most important location groups, include: story job, visual personality, practical needs, scenes, and risk.
## Company Moves & Friction
Where the schedule gets punished. Cite scenes.
## Exterior / Night / Crowd Risk
Concrete risk list.
## What To Preserve
5 location choices or qualities that should not be watered down.`,

  cast: `${groundingRules}
You are a casting director and performance-minded producer. Improve Cast & Crew by explaining acting burden and character chemistry.

Use this creative director context:
{{creativeDirector}}

Format:
# Cast & Crew: Casting Pass
## Casting Thesis
One paragraph on what the ensemble has to carry.
## Principal Roles
For each principal character: casting energy, performance burden, relationship tension, scenes that prove it, and physical/special demands.
## Chemistry Map
Explain the core pairings or collisions.
## Specialty Department Flags
Only list crew/specialty needs implied by the script, with scene evidence.
## What Not To Cast
5 bullets on false instincts to avoid.`,

  production: `${groundingRules}
You are a production designer reading for the material world. Improve Production Design by turning props, wardrobe, and sets into a coherent visual system.

Use this creative director context:
{{creativeDirector}}

Format:
# Production Design: Designer Pass
## Material World
One paragraph on the film's physical language.
## Set Dressing Rules
5-7 rules tied to locations and scenes.
## Hero Objects
Prioritize recurring or story-critical objects. For each: scenes, narrative job, visual handling, multiples/practical notes.
## Wardrobe Logic
Explain wardrobe as character and story pressure, with scene evidence.
## Motif Continuity
Track repeated objects, colors, surfaces, or shapes.
## What To Avoid
Design choices that would flatten the script.`,

  titleAndPalette: `${groundingRules}
You are a film graphic designer building the title and palette system for a pitch deck and key art exploration.

Use this creative director context:
{{creativeDirector}}

Format:
# Title & Palette: Graphic Design Pass
## Title Read
What the title should feel like typographically and why.
## Palette System
5-7 colors with hex codes, each tied to concrete script evidence.
## Typography Direction
Display type, secondary type, spacing, scale, and restraint.
## Deck Identity Rules
How this should translate across the Greenlight deck.
## Thumbnail Read
What survives small.
## Avoid
5 graphic-design mistakes to avoid.`,

  posterConcepts: `${groundingRules}
You are a film key art designer making early one-sheet directions. Improve Poster Concepts by making each idea behave like actual key art, not generic AI prompts.

Use this creative director context:
{{creativeDirector}}

Format:
# Poster Concepts: Key Art Pass
## One-Sheet Thesis
One paragraph on the key art problem.
## Primary Directions
Create 8 strong concepts. For each include: concept name, one-sheet logic, composition, script evidence, typography, thumbnail read, what not to include, and AI image prompt.
## Teaser Directions
3 restrained teaser concepts.
## Series Logic
How the campaign could unfold.
## Best Bets
Rank the top 3 concepts and explain why.`,
};

const editorPrompt = `${groundingRules}
You are the final editor on Greenlight's report output. Apply a light humanizer/taste pass.

Rules:
- Preserve all factual claims and section structure.
- Remove AI tells: inflated significance language, "serves as", "testament", generic "haunting/gritty/cinematic", fake profundity, and repetitive rule-of-three phrasing.
- Keep it concise, direct, and useful to a film collaborator.
- Do not add new facts.
- Output only the revised markdown.
`;

function promptWithContext(template, creativeDirector) {
  return template.replace("{{creativeDirector}}", creativeDirector);
}

async function compareTab(tab, before, after) {
  const prompt = `
You are reviewing an A/B prompt experiment for Greenlight, a film vision deck generator.

Score Before and After from 1-5 on:
- Specificity
- Usefulness
- Taste
- Originality
- Tab fit
- Demo value

Then write a short verdict on which version is stronger and why. Flag failures: jargon, overlong prose, hallucinated details, or content that feels less designed.

Output clean markdown only, starting with "### ${tab}".
`;
  return callClaude(
    prompt,
    {
      tab,
      before,
      after,
    },
    1600,
  );
}

function linkFor(runDir, filePath) {
  return relative(runDir, filePath);
}

async function main() {
  const project = loadCachedProject();
  const data = JSON.parse(project.jsonData);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(RUNS_DIR, timestamp);
  const beforeDir = join(runDir, "before");
  const afterDir = join(runDir, "after");
  ensureDir(beforeDir);
  ensureDir(afterDir);

  const beforeDocs = {
    overview: getDoc(project, "overview"),
    "mood-and-tone": getDoc(project, "mood-and-tone"),
    scenes: getDoc(project, "scene-breakdown"),
    locations: currentLocations(data),
    "cast-and-crew": currentCast(data),
    "production-design": currentProduction(data),
    "title-and-palette": currentTitleAndPalette(data, getDoc(project, "mood-and-tone")),
    posters: getDoc(project, "poster-concepts"),
  };

  for (const [slug, content] of Object.entries(beforeDocs)) {
    writeMarkdown(join(beforeDir, `${slug}.md`), content);
  }

  console.log(`Run folder: ${relative(PROJECT_ROOT, runDir)}`);
  console.log(`Provider: ${PROVIDER}`);
  console.log(`Model: ${MODEL}`);
  console.log("Generating Creative Director pass...");
  const creativeDirector = await callClaude(
    rolePrompts.creativeDirector,
    roleInput(data, "all"),
    2200,
  );
  writeMarkdown(join(afterDir, "creative-director.md"), creativeDirector);

  const afterTasks = [
    ["overview", "overview", "all"],
    ["mood-and-tone", "mood", "mood"],
    ["locations", "locations", "locations"],
    ["cast-and-crew", "cast", "cast"],
    ["production-design", "production", "production"],
    ["title-and-palette", "titleAndPalette", "key-art"],
    ["poster-concepts", "posterConcepts", "key-art"],
  ];

  const afterDocs = {};
  for (const [slug, promptKey, inputKey] of afterTasks) {
    console.log(`Generating ${slug}...`);
    const content = await callClaude(
      promptWithContext(rolePrompts[promptKey], creativeDirector),
      roleInput(data, inputKey),
      6000,
    );
    const edited = process.env.GREENLIGHT_HUMANIZER_PASS === "1"
      ? await callClaude(editorPrompt, { report: content }, 6000)
      : content;
    afterDocs[slug] = edited;
    writeMarkdown(join(afterDir, `${slug}.md`), edited);
  }

  console.log("Generating comparison scorecards...");
  const tabPairs = [
    ["Overview", "overview", "overview"],
    ["Mood & Tone", "mood-and-tone", "mood-and-tone"],
    ["Locations", "locations", "locations"],
    ["Cast & Crew", "cast-and-crew", "cast-and-crew"],
    ["Production Design", "production-design", "production-design"],
    ["Title & Palette", "title-and-palette", "title-and-palette"],
    ["Poster Concepts", "posters", "poster-concepts"],
  ];

  const comparisons = [];
  for (const [label, beforeSlug, afterSlug] of tabPairs) {
    console.log(`Comparing ${label}...`);
    comparisons.push(await compareTab(label, beforeDocs[beforeSlug], afterDocs[afterSlug]));
  }

  const fileIndex = tabPairs
    .map(([label, beforeSlug, afterSlug]) => {
      const beforePath = join(beforeDir, `${beforeSlug}.md`);
      const afterPath = join(afterDir, `${afterSlug}.md`);
      return `| ${label} | [Before](${linkFor(runDir, beforePath)}) | [After](${linkFor(runDir, afterPath)}) |`;
    })
    .join("\n");

  const comparison = `# Greenlight Role-Pass Comparison

Project: ${data.title}  
Model: ${MODEL}  
Run: ${timestamp}

## Files

| Tab | Current / Before | Role-Pass / After |
|---|---|---|
${fileIndex}

## Reviewer Scorecards

${comparisons.join("\n\n")}

## Notes

- The before reports use the current cached Greenlight output where generated docs exist.
- Before reports for Locations, Cast & Crew, Production Design, and Title & Palette are reconstructed from the same JSON because those tabs are currently derived in the UI rather than generated as markdown docs.
- The after reports are role-specific LLM passes and include a Creative Director synthesis file at [after/creative-director.md](after/creative-director.md).
`;

  writeMarkdown(join(runDir, "comparison.md"), comparison);
  console.log(`Done: ${relative(PROJECT_ROOT, join(runDir, "comparison.md"))}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
