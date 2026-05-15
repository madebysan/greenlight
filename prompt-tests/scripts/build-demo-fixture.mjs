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
      "  --preserve-images-from=<module>  Reuse image maps from an existing demo module.",
      "  --output-file=<module>           Write the generated project to a custom module path.",
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

function normalizeTitle(value) {
  const title = cleanString(value) || "Untitled";
  if (title === title.toUpperCase()) return titleCase(title.toLowerCase());
  return title;
}

function normalizeData(data) {
  return {
    ...data,
    title: normalizeTitle(data.title),
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

function textProfile(data) {
  const genre = data.genre.join(" ").toLowerCase();
  const tone = (data.tone || "").toLowerCase();
  const period = (data.setting_period || "").toLowerCase();
  const profileText = `${genre} ${tone} ${period}`;

  if (/romance|romantic|melancholic|diaspor|immigration|identity|contemporary drama/.test(profileText)) {
    return {
      kind: "intimate-romance",
      descriptors: [
        "held silence",
        "emotional distance",
        "missed timing",
        "ordinary rooms",
        "language as intimacy",
        "negative space",
        "chosen lives",
        "memory in public places",
      ],
      references: [
        ["In the Mood for Love (2000)", "Romance made from restraint, glances, repeated spaces, and impossible timing."],
        ["Before Sunset (2004)", "Walking conversation where an entire life is measured through unfinished feeling."],
        ["Columbus (2017)", "Architecture, distance, and stillness used as emotional pressure."],
        ["Lost in Translation (2003)", "Two people suspended between languages, cities, and versions of themselves."],
        ["Yi Yi (2000)", "Family, time, and urban life held with patience instead of melodrama."],
      ],
      palette: [
        ["Bar Booth Black", "#151515", "Late-night interiors where the unsaid sits between people."],
        ["Laptop Blue", "#6F8396", "Screens, distance, and the cold intimacy of reconnection."],
        ["Seoul Concrete", "#A8A19A", "Childhood streets and memory softened by time."],
        ["Dawn Peach", "#D6A58C", "Farewells, early light, and the tenderness after restraint breaks."],
        ["Passport Green", "#3E5335", "Immigration, chosen identity, and the administrative texture of leaving."],
      ],
      soundtrackReferences: [
        ["In the Mood for Love (2000)", "A repeated romantic motif that turns restraint into ache."],
        ["Her (2013)", "Sparse piano and electronic warmth for technologically mediated intimacy."],
        ["Columbus (2017)", "Minimal music that lets architecture and silence hold feeling."],
        ["Minari (2020)", "Soft memory, family distance, and diasporic tenderness without overstatement."],
      ],
      campaignAudience: "arthouse romance and character-drama audiences",
      storyFallback: "distance, posture, silence, and practical objects that carry memory",
      overviewFocus: "time, language, and the lives not chosen",
      overviewMovement: "measures the life she chose against the childhood self and first love she left behind",
      complexityRead: "Emotionally precise scope. The deck should foreground performance, language, time jumps, cities, screens, and quiet blocking rather than spectacle.",
      taglines: [
        "Some lives continue without you.",
        "What if timing is the whole story?",
        "Every goodbye keeps another self alive.",
      ],
      sceneTaglines: ["A room can hold twenty-four years.", "The screen is not enough.", "Some endings arrive quietly."],
    };
  }

  if (/historical|period|royal|court|queen|king|palace|18th|17th|19th/.test(profileText)) {
    return {
      kind: "period-court",
      descriptors: [
        "court ritual",
        "powdered elegance",
        "class pressure",
        "weaponized intimacy",
        /comedy|comic|satire|satirical|absurd|dark comedic/.test(profileText) ? "acid comedy" : "social menace",
        "opulent decay",
        "ceremonial cruelty",
      ],
      references: [
        ["Barry Lyndon (1975)", "Candlelit period formality where power is embedded in composition and gesture."],
        ["Dangerous Liaisons (1988)", "Private manipulation staged through etiquette, costume, and rooms built for performance."],
        ["Orlando (1992)", "Period imagery with wit, theatricality, and a self-aware relationship to history."],
        ["Marie Antoinette (2006)", "Courtly excess, pastel surfaces, and emotional isolation inside decorative abundance."],
        ["Amadeus (1984)", "Lavish interiors, rivalry, humiliation, and the comedy of public status games."],
      ],
      palette: [
        ["Candle Gold", "#C49A47", "Firelight, gilt interiors, and rank made visible through surfaces."],
        ["Powdered Ivory", "#E6DDC9", "Pale makeup, linen, letters, and fragile aristocratic restraint."],
        ["Velvet Crimson", "#8B1E2D", "Rivalry, blood, wine, and private violence under polished ceremony."],
        ["Gout Blue", "#536B85", "Illness, damp rooms, and the Queen's emotional distance."],
        ["Ink Black", "#171513", "Secret passages, formal dress, and power moves hidden in shadow."],
      ],
      soundtrackReferences: [
        ["Barry Lyndon (1975)", "Formal classical weight and candlelit restraint."],
        ["The Draughtsman's Contract (1982)", "Baroque repetition, wit, and controlled mischief."],
        ["Amadeus (1984)", "Court spectacle with rivalry under the surface."],
        ["The Piano (1993)", "Intimate touch, withheld feeling, and room-scale tension."],
      ],
      campaignAudience: "period drama, black comedy, and performance-led arthouse audiences",
      storyFallback: "rank, costume, body language, and objects that reveal status",
      overviewFocus: "status, appetite, intimacy, and survival inside a court",
      overviewMovement: "turns private dependency into public advantage",
      complexityRead: "High craft scope. The deck should foreground performance, costume, animals/props, court interiors, intimacy, violence, and the choreography of status.",
      taglines: [
        "Every favor has teeth.",
        "Love curdles where power eats.",
        "The court always watches.",
      ],
      sceneTaglines: ["Every room has a favorite.", "Loyalty changes costume.", "Grace can become exile."],
    };
  }

  if (/horror|thriller|suspense|mystery/.test(profileText)) {
    return {
      kind: "horror-thriller",
      descriptors: [
        "slow dread",
        "social pressure",
        "spatial unease",
        "controlled suspicion",
        "domestic threat",
        "ritual behavior",
      ],
      references: [
        ["Rosemary's Baby (1968)", "Ordinary hospitality becomes conspiracy through space, manners, and proximity."],
        ["The Conversation (1974)", "Suspicion, surveillance, and sound as evidence."],
        ["Eyes Wide Shut (1999)", "Ritual, wealth, and coded social performance create dread without overt monsters."],
        ["The Haunting (1963)", "Contained spatial dread where architecture and sound suggest more than they show."],
        ["Parasite (2019)", "Architecture and class pressure shape every character choice."],
      ],
      palette: [
        ["Shadow Black", "#151515", "The negative space around the story's threat."],
        ["Domestic Cream", "#E6DDC9", "Soft surfaces that hide pressure."],
        ["Cold Blue", "#7F9BB2", "Clinical distance and emotional control."],
        ["Blood Red", "#9C1B22", "Moments where bodily cost breaks through."],
        ["Ground Green", "#3E5335", "Exterior calm that can turn hostile."],
      ],
      soundtrackReferences: [
        ["Sicario (2015)", "Low-frequency dread and disciplined escalation."],
        ["The Conversation (1974)", "Sound as clue, pressure, and emotional distance."],
        ["Under the Skin (2013)", "Minimal texture and bodily unease."],
        ["Birth (2004)", "Elegant restraint with a destabilizing emotional charge."],
      ],
      campaignAudience: "psychological thriller and prestige horror audiences",
      storyFallback: "space, bodies, sound, and props that turn safety into threat",
      overviewFocus: "threat, control, social performance, and survival",
      overviewMovement: "moves from ordinary safety into a trap whose rules become visible too late",
      complexityRead: "Contained but tense scope. The deck should foreground controlled space, escalation, practical threat, key objects, violence, and the rhythm of revelation.",
      taglines: [
        "The room knows before you do.",
        "Safety has a shape.",
        "What watches also waits.",
      ],
      sceneTaglines: ["The trap is already polite.", "Seeing becomes survival.", "The house has rules."],
    };
  }

  if (/sci-fi|science fiction|action|epic/.test(profileText)) {
    return {
      kind: "sci-fi-action",
      descriptors: [
        "monumental scale",
        "political machinery",
        "controlled awe",
        "survival discipline",
        "material restraint",
      ],
      references: [
        ["Lawrence of Arabia (1962)", "Monumental landscape scale and small human figures overwhelmed by place."],
        ["2001: A Space Odyssey (1968)", "Ritual pacing, architectural silence, and cosmic dread without visual clutter."],
        ["Mad Max: Fury Road (2015)", "Action where vehicles, bodies, weather, and geography become one production system."],
        ["Arrival (2016)", "Austere science-fiction awe with emotional restraint and clean visual grammar."],
        ["Apocalypse Now (1979)", "Imperial machinery, ceremonial violence, and political madness."],
      ],
      palette: [
        ["Weathered Ochre", "#C88935", "Heat, dust, age, and harsh environmental exposure."],
        ["Slate Blue", "#3D4652", "Stone, rain, metal, and institutional coldness."],
        ["Ceremonial Black", "#111513", "Armor, ritual, and military severity."],
        ["Bone White", "#D9D0BC", "Sacred objects, dry light, and fragile human scale."],
        ["Smoke Gray", "#4A4642", "Industrial spaces, machinery, and exhausted atmosphere."],
      ],
      soundtrackReferences: [
        ["Sicario (2015)", "Low-frequency dread and disciplined escalation."],
        ["Arrival (2016)", "Vocal texture and awe without decorative excess."],
        ["The Thin Red Line (1998)", "War, prayer, and landscape held in one sonic field."],
        ["Mad Max: Fury Road (2015)", "Percussive machinery and action rhythm tied to geography."],
      ],
      campaignAudience: "large-scale genre and design-forward audiences",
      storyFallback: "scale, machinery, bodies, and practical objects that define the world",
      overviewFocus: "inheritance, systems, survival, and human scale against environment",
      overviewMovement: "is pulled from inheritance into a hostile system where survival becomes identity",
      complexityRead: "Large-scale craft scope. The deck should foreground worldbuilding, vehicles, combat, VFX, environments, props, and the production systems that make scale legible.",
      taglines: [
        "Inheritance is a hostile world.",
        "The future arrives armed.",
        "Power has a landscape.",
      ],
      sceneTaglines: ["Scale has teeth.", "Ritual turns into survival.", "No inheritance is clean."],
    };
  }

  if (/fantasy|family|fable|child|children|magical|wonder/.test(profileText)) {
    return {
      kind: "fable",
      descriptors: [
        "street-level wonder",
        "childlike logic",
        "gentle rebellion",
        "object personality",
        "public magic",
        "loneliness softened",
      ],
      references: [
        ["My Life as a Zucchini (2016)", "Childlike emotional directness without condescension."],
        ["The 400 Blows (1959)", "Children moving through a city with melancholy and freedom."],
        ["Where Is the Friend's House? (1987)", "A child's moral quest made through simple spaces and repeated obstacles."],
        ["Amelie (2001)", "Urban whimsy grounded by everyday objects and gestures."],
        ["The Spirit of the Beehive (1973)", "Childhood wonder and loneliness staged with quiet, symbolic restraint."],
      ],
      palette: [
        ["Balloon Red", "#C8272D", "The central object as emotion made visible."],
        ["Paris Stone", "#B8B0A2", "Street walls, schoolyards, and ordinary city texture."],
        ["Rain Gray", "#7E8587", "Weather and public rules pressing on a child."],
        ["Schoolhouse Black", "#171513", "Authority, gates, and interior restraint."],
        ["Sky Blue", "#8CAFC8", "Freedom, lift, and the final upward release."],
      ],
      soundtrackReferences: [
        ["The Spirit of the Beehive (1973)", "Sparse, childlike wonder held inside ordinary places."],
        ["Amelie (2001)", "Whimsy through small repeated motifs."],
        ["My Neighbor Totoro (1988)", "Wonder treated as ordinary rather than explained."],
        ["Kes (1969)", "Childhood tenderness held inside everyday realism."],
      ],
      campaignAudience: "family, fable, and cinephile short-film audiences",
      storyFallback: "object behavior, child posture, city rules, and small acts of wonder",
      overviewFocus: "loneliness, companionship, and everyday magic",
      overviewMovement: "finds companionship in an object that behaves like a friend",
      complexityRead: "Precise practical-magic scope. The deck should foreground object behavior, child performance, street geography, weather, crowd control, and invisible rigging/VFX.",
      taglines: [
        "A city learns to look up.",
        "One friend is enough to change the street.",
        "Magic follows when called.",
      ],
      sceneTaglines: ["The city has rules.", "A friend can float away.", "Wonder rises together."],
    };
  }

  return {
    kind: "general-drama",
    descriptors: [
      "character pressure",
      "visual restraint",
      "location-driven stakes",
      "object-led storytelling",
      "emotional precision",
      "cinematic economy",
    ],
    references: [
      ["Parasite (2019)", "Architecture and class pressure shape every character choice."],
      ["The Social Network (2010)", "Clean dramatic momentum and status battles made visual."],
      ["Phantom Thread (2017)", "Control, intimacy, and production design as emotional language."],
      ["Michael Clayton (2007)", "Institutional pressure rendered through restrained, precise images."],
      ["Carol (2015)", "Period detail and withheld emotion carried through color, texture, and blocking."],
    ],
    palette: [
      ["Deep Ink", "#151515", "The negative space around the central conflict."],
      ["Paper Warmth", "#E6DDC9", "Documents, rooms, and practical objects that hold story pressure."],
      ["Steel Blue", "#6F8396", "Emotional control and institutional distance."],
      ["Signal Red", "#9C1B22", "Moments where consequence breaks the surface."],
      ["Ground Green", "#3E5335", "Exterior calm and practical material texture."],
    ],
    soundtrackReferences: [
      ["Phantom Thread (2017)", "Elegant surface with pressure underneath."],
      ["Carol (2015)", "Interior emotion carried through restrained orchestration."],
      ["Michael Clayton (2007)", "Low-key tension with clean dramatic control."],
      ["The Social Network (2010)", "Rhythm and status conflict without clutter."],
    ],
    campaignAudience: "prestige drama and design-forward audiences",
    storyFallback: "blocking, silence, texture, and practical objects that carry the emotional beat",
    overviewFocus: "character pressure, place, and visible consequence",
    overviewMovement: "moves through a chain of choices that make the central conflict visible",
    complexityRead: "Moderate craft scope. The deck should foreground performance, recurring locations, props, and the visual pattern connecting emotional turns.",
    taglines: [
      "Every choice leaves evidence.",
      "The room remembers.",
      "Nothing stays abstract for long.",
    ],
    sceneTaglines: ["The room carries the choice.", "The test is already visible.", "No turn is neutral."],
  };
}

function buildOverviewFrame(data, profile, lead, centralLocation, firstSetPiece, lastScene) {
  const leadName = lead?.name || "The protagonist";
  const firstMoment = sentence(data.scenes[0].key_visual_moment);
  const setPieceLine = firstSetPiece
    ? `Scene ${firstSetPiece.scene_number} gives the deck an early production anchor: ${firstSetPiece.key_visual_moment}`
    : `The opening image gives the deck its first production anchor: ${data.scenes[0].key_visual_moment}`;
  const lastMoment = lastScene
    ? `The final movement lands on Scene ${lastScene.scene_number}: ${lastScene.key_visual_moment}`
    : "";

  if (profile.kind === "intimate-romance") {
    return {
      logline: `${leadName} ${profile.overviewMovement}, turning ${data.themes[0]?.toLowerCase() || "memory"} into a quiet question of timing, language, and home.`,
      taglines: profile.taglines,
      synopsis: `${data.title} opens with ${firstMoment} The film then moves between childhood, screens, marriage, and New York public spaces, letting ordinary locations carry the weight of lives that almost happened. ${leadName} is not chasing spectacle; she is measuring distance, memory, and identity against the person who remembers who she used to be. ${setPieceLine} ${lastMoment}`,
      productionRead: `${data.locations.length} major locations, ${data.scenes.length} scenes, and a craft burden centered on performance, language, time jumps, restrained blocking, and precise urban atmosphere.`,
      complexity: profile.complexityRead,
    };
  }

  if (profile.kind === "period-court") {
    return {
      logline: `${leadName} ${profile.overviewMovement}, turning ${data.themes[0]?.toLowerCase() || "status"} into a battle of rooms, costumes, favors, and bodies under watch.`,
      taglines: profile.taglines,
      synopsis: `${data.title} opens with ${firstMoment} From there, the script turns court life into a pressure system where intimacy, humiliation, illness, and appetite become practical design choices. ${setPieceLine} ${lastMoment}`,
      productionRead: `${data.locations.length} major locations, ${data.scenes.length} scenes, and a craft burden centered on period interiors, costume shifts, animals/props, intimacy, practical violence, and status choreography.`,
      complexity: profile.complexityRead,
    };
  }

  if (profile.kind === "horror-thriller") {
    return {
      logline: `${leadName} ${profile.overviewMovement}, turning ${data.themes[0]?.toLowerCase() || "threat"} into a readable system of space, sound, objects, and social behavior.`,
      taglines: profile.taglines,
      synopsis: `${data.title} opens with ${firstMoment} The story keeps tightening the viewer's relationship to place: what first seems ordinary becomes evidence, then threat, then trap. ${setPieceLine} ${lastMoment}`,
      productionRead: `${data.locations.length} major locations, ${data.scenes.length} scenes, and a craft burden centered on controlled space, escalation, key props, violence, and the timing of revelation.`,
      complexity: profile.complexityRead,
    };
  }

  if (profile.kind === "sci-fi-action") {
    return {
      logline: `${leadName} ${profile.overviewMovement}, turning ${data.themes[0]?.toLowerCase() || "inheritance"} into visible worlds, machines, rituals, and survival systems.`,
      taglines: profile.taglines,
      synopsis: `${data.title} opens with ${firstMoment} From there, the script expands through locations, rituals, combat work, and objects that make the world feel governed by systems larger than any single character. ${setPieceLine} ${lastMoment}`,
      productionRead: `${data.locations.length} major locations, ${data.scenes.length} scenes, and a craft burden centered on worldbuilding, VFX, vehicles, combat, environments, and object continuity.`,
      complexity: profile.complexityRead,
    };
  }

  if (profile.kind === "fable") {
    return {
      logline: `${leadName} ${profile.overviewMovement}, turning ${data.themes[0]?.toLowerCase() || "companionship"} into simple street behavior, object choreography, and public wonder.`,
      taglines: profile.taglines,
      synopsis: `${data.title} opens with ${firstMoment} The film builds from tiny rules and repeated city spaces: where the object can go, who refuses it, who notices it, and how a child's attachment changes the street around him. ${setPieceLine} ${lastMoment}`,
      productionRead: `${data.locations.length} major locations, ${data.scenes.length} scenes, and a craft burden centered on child performance, object behavior, weather, street geography, crowd movement, and invisible rigging/VFX.`,
      complexity: profile.complexityRead,
    };
  }

  return {
    logline: `${leadName} ${profile.overviewMovement}, turning ${data.themes[0]?.toLowerCase() || "the central conflict"} into concrete choices, locations, and images.`,
    taglines: profile.taglines,
    synopsis: `${data.title} opens with ${firstMoment} From there, the script follows ${leadName} through a chain of places, relationships, and visible consequences. ${setPieceLine} ${lastMoment}`,
    productionRead: `${data.locations.length} major locations, ${data.scenes.length} scenes, and a craft burden centered on performance, recurring locations, props, and the visual pattern connecting emotional turns.`,
    complexity: profile.complexityRead,
  };
}

function buildAtmosphere(data, profile) {
  const firstScene = data.scenes[0];
  const lastScene = data.scenes.at(-1);

  if (profile.kind === "intimate-romance") {
    return `The film should feel ${data.tone || "quiet and emotionally precise"}: time gathering in ordinary places, where a bar booth, laptop screen, park bench, ferry rail, or apartment bedroom can hold years of unsaid feeling. Scene ${firstScene.scene_number} starts with withheld context and a direct look; Scene ${lastScene.scene_number} lets release arrive only after the goodbye has already happened.`;
  }

  if (profile.kind === "period-court") {
    return `The film should feel ${data.tone || "sharp and ceremonial"}: rooms full of polish where every courtesy can become cruelty. Scene ${firstScene.scene_number} sets the social fall into motion, while Scene ${lastScene.scene_number} shows the body cost of winning inside a system built on dependence.`;
  }

  if (profile.kind === "horror-thriller") {
    return `The film should feel ${data.tone || "controlled and threatening"}: ordinary spaces becoming legible as traps. Scene ${firstScene.scene_number} introduces the first rupture in safety, and Scene ${lastScene.scene_number} leaves the viewer with the cost of surviving the rules too late.`;
  }

  if (profile.kind === "sci-fi-action") {
    return `The film should feel ${data.tone || "monumental and disciplined"}: human figures pressed against systems, machines, weather, ceremony, and violence. Scene ${firstScene.scene_number} establishes scale and threat; Scene ${lastScene.scene_number} closes on survival reshaping identity.`;
  }

  if (profile.kind === "fable") {
    return `The film should feel ${data.tone || "simple and wondrous"}: everyday streets quietly accepting impossible behavior. Scene ${firstScene.scene_number} makes the central object feel discovered rather than explained, and Scene ${lastScene.scene_number} turns private attachment into public magic.`;
  }

  return `The film should feel ${data.tone || "controlled and cinematic"}: specific enough that every location, object, and gesture changes the emotional read. Scene ${firstScene.scene_number} gives the first image; Scene ${lastScene.scene_number} closes the movement with the clearest consequence.`;
}

function buildSoundDirection(data, profile, recurringLocations, musicCues, soundAnchors) {
  if (profile.kind === "intimate-romance") {
    return `Sound should protect silence. The recurring spaces (${list(recurringLocations, "the primary locations")}) need distinct room tones so time, language, and distance feel different in Seoul, online, and New York. ${musicCues.length ? `The explicit cue${musicCues.length === 1 ? "" : "s"} should anchor ${musicCues.map((scene) => `Scene ${scene.scene_number} (${scene.music_cue})`).join(", ")} without over-scoring the emotional turns.` : "With few explicit music cues, the score should stay sparse enough for breath, traffic, keyboard noise, glassware, and pauses to carry feeling."}`;
  }

  if (profile.kind === "fable") {
    return `Sound should make the magical behavior feel ordinary. The recurring spaces (${list(recurringLocations, "the primary locations")}) need clear city texture, footsteps, weather, school noise, and small object sounds so wonder can appear inside daily life. ${musicCues.length ? `Use the supplied cue${musicCues.length === 1 ? "" : "s"} as light anchors: ${musicCues.map((scene) => `Scene ${scene.scene_number} (${scene.music_cue})`).join(", ")}.` : "The score can be melodic and spare, following movement rather than announcing emotion."}`;
  }

  if (profile.kind === "horror-thriller") {
    return `Sound should make safety unreliable. The recurring spaces (${list(recurringLocations, "the primary locations")}) need room tones that shift from ordinary to threatening. ${musicCues.length ? `The explicit cue${musicCues.length === 1 ? "" : "s"} should anchor ${musicCues.map((scene) => `Scene ${scene.scene_number} (${scene.music_cue})`).join(", ")}.` : "Where no cue is supplied, hold back and let silence, object sounds, footsteps, doors, and breath create escalation."} ${soundAnchors.length ? `Priority sound anchors: ${soundAnchors.map((scene) => `Scene ${scene.scene_number} (${list(scene.props.concat(scene.vfx_stunts), "movement and room tone")})`).join("; ")}.` : ""}`;
  }

  return `Sound should make the film's pressure legible without adding story details beyond the supplied JSON. The recurring spaces (${list(recurringLocations, "the primary locations")}) need distinct room tones so shifts in status, scale, or emotion can be heard before they are explained. ${musicCues.length ? `The explicit cue${musicCues.length === 1 ? "" : "s"} should anchor ${musicCues.map((scene) => `Scene ${scene.scene_number} (${scene.music_cue})`).join(", ")}.` : "No explicit music cues are supplied, so the score should stay restrained and let movement, fabric, objects, and room tone carry pressure."} ${soundAnchors.length ? `Priority sound anchors: ${soundAnchors.map((scene) => `Scene ${scene.scene_number} (${list(scene.props.concat(scene.vfx_stunts), "movement and room tone")})`).join("; ")}.` : ""}`;
}

function posterLanguage(profile, data, lead, supporting, heroProps, primaryLocation) {
  const leadName = lead?.name || "The lead";
  const ensemble = [lead, ...supporting].filter(Boolean).map((character) => character.name).join(", ");
  const object = heroProps[0]?.item || data.props_master[0]?.item || "a central object";

  if (profile.kind === "intimate-romance") {
    return {
      characterName: "The Space Between Them",
      characterStyle: "Negative-space romantic one-sheet",
      characterComposition: `${leadName} held in a quiet frame with ${primaryLocation} implied through light, reflection, or distance rather than spectacle.`,
      characterTagline: "Some lives continue without you.",
      characterMood: "Tender, unresolved, restrained",
      characterAppeal: "Viewers drawn to intimate romance, diasporic identity, and restrained performance.",
      characterPrompt: `Restrained romantic drama poster for ${data.title}, ${leadName} framed by negative space in ${primaryLocation}, quiet eye line, city light, emotional distance, no melodrama, only details from the screenplay JSON.`,
      ensembleName: "Three People at the Same Table",
      ensembleStyle: "Triangular relationship poster",
      ensembleComposition: `${ensemble} separated by a bar table, apartment doorway, or reflected glass so the geometry shows tenderness, marriage, and the life not chosen.`,
      ensembleTagline: "Every choice leaves a ghost.",
      ensembleMood: "Awkward, compassionate, suspended",
      ensembleAppeal: "Arthouse audiences interested in love stories without villains.",
      ensemblePrompt: `Ensemble key art for ${data.title}, ${ensemble} in a quiet triangular composition, bar or apartment interior, emotional distance, no romantic cliche, no invented characters.`,
      objectName: "The Object That Kept the Thread",
      objectStyle: "Memory-object poster",
      objectComposition: `${object} isolated as an ordinary item that carries years of memory rather than plot mechanics.`,
      objectTagline: "The past has a small shape.",
      objectMood: "Plain, intimate, aching",
      objectAppeal: "Viewers who respond to symbolic everyday objects.",
      objectPrompt: `Minimal poster for ${data.title}, ${object} treated as a memory object, quiet light, restrained negative space, contemporary romantic drama, no unrelated props.`,
      locationName: "Cities as Memory",
      locationComposition: `${titleCase(primaryLocation)} or a second recurring location held as an empty emotional space, with a small figure at the edge of the frame.`,
      locationTagline: "Home is a question of timing.",
      locationMood: "Open, urban, wistful",
      locationAppeal: profile.campaignAudience,
      titleComposition: "The title set across a wide field of negative space, with one thin dividing line suggesting distance, time, or translation.",
      titleTagline: "What if then is still here?",
      titlePrompt: `Minimal typographic poster for ${data.title}, title separated by quiet negative space, subtle city or screen texture, one small human silhouette, no unrelated genre language.`,
      mapTagline: "Every place remembers a different self.",
    };
  }

  if (profile.kind === "period-court") {
    return {
      characterName: `${leadName} at Court`,
      characterStyle: "Court portrait one-sheet",
      characterComposition: `${leadName} framed inside ${primaryLocation}, with costume, posture, and eye line carrying status.`,
      characterTagline: "Every favor has teeth.",
      characterMood: "Elegant, cruel, watchful",
      characterAppeal: "Viewers drawn to performance, costume, status games, and black comedy.",
      characterPrompt: `Period black-comedy poster for ${data.title}, ${leadName} in ${primaryLocation}, courtly posture, precise costume detail, sharp wit, no invented characters.`,
      ensembleName: "The Court Watches",
      ensembleStyle: "Formal status tableau",
      ensembleComposition: `${ensemble} arranged by rank, intimacy, and suspicion rather than equal heroic scale.`,
      ensembleTagline: "The room always takes a side.",
      ensembleMood: "Ceremonial, vicious, comic",
      ensembleAppeal: profile.campaignAudience,
      ensemblePrompt: `Ensemble key art for ${data.title}, ${ensemble} arranged by court status in ${primaryLocation}, dark comedy, period texture, no unrelated genre details.`,
      objectName: "The Favor Object",
      objectStyle: "Symbolic court-object poster",
      objectComposition: `${object} isolated like a small instrument of leverage, surrounded by court texture and negative space.`,
      objectTagline: "A little thing can ruin a life.",
      objectMood: "Precise, poisonous, funny",
      objectAppeal: "Viewers who respond to iconic props and period design.",
      objectPrompt: `Minimal period poster for ${data.title}, ${object} as a court object with social consequence, candlelit restraint, no unrelated props.`,
      locationName: "The Room as Court",
      locationComposition: `${titleCase(primaryLocation)} becomes the campaign image, with rank, furniture, animal/prop detail, and a small human figure showing the social order.`,
      locationTagline: "The court always watches.",
      locationMood: "Opulent, tense, decaying",
      locationAppeal: profile.campaignAudience,
      titleComposition: "The title treated like a court appointment, formal and sharp, with a small prop or animal detail interrupting the symmetry.",
      titleTagline: "Grace can become exile.",
      titlePrompt: `Minimal typographic poster for ${data.title}, formal period title treatment, court texture, one prop or animal detail from the JSON, no unrelated genre language.`,
      mapTagline: "Every room has a favorite.",
    };
  }

  if (profile.kind === "fable") {
    return {
      characterName: `${leadName} and the Companion`,
      characterStyle: "Child-and-object one-sheet",
      characterComposition: `${leadName} small in the city with ${object} creating the emotional focal point above or beside him.`,
      characterTagline: "A city learns to look up.",
      characterMood: "Gentle, curious, lonely",
      characterAppeal: "Family, fable, and cinephile audiences.",
      characterPrompt: `Gentle fable poster for ${data.title}, ${leadName} with ${object} in an everyday city space, simple wonder, no invented characters.`,
      ensembleName: "The Street Notices",
      ensembleStyle: "Public wonder tableau",
      ensembleComposition: `${ensemble || leadName} arranged in a street or school space where ordinary adults and children react to impossible object behavior.`,
      ensembleTagline: "Magic follows when called.",
      ensembleMood: "Playful, public, tender",
      ensembleAppeal: profile.campaignAudience,
      ensemblePrompt: `Fable key art for ${data.title}, city street, child performer, central object behavior, public wonder, no unrelated genre details.`,
      objectName: "The Companion Object",
      objectStyle: "Object-first icon poster",
      objectComposition: `${object} isolated with enough string, shadow, or surrounding air to imply personality.`,
      objectTagline: "One friend can change the street.",
      objectMood: "Pure, lonely, magical",
      objectAppeal: "Viewers who respond to simple iconic objects.",
      objectPrompt: `Minimal fable poster for ${data.title}, ${object} as a living companion, clean negative space, childlike wonder, no text in image.`,
      locationName: "The City Looks Up",
      locationComposition: `${titleCase(primaryLocation)} or another repeated city space becomes a field of ordinary rules interrupted by the central object.`,
      locationTagline: "Wonder rises together.",
      locationMood: "Open, playful, wistful",
      locationAppeal: profile.campaignAudience,
      titleComposition: "The title kept small under a large field of sky or street space, with the central object giving the poster its shape.",
      titleTagline: "Come when called.",
      titlePrompt: `Minimal typographic poster for ${data.title}, large field of sky or street, ${object} as the visual punctuation, simple fable tone, no unrelated genre language.`,
      mapTagline: "Every street has a rule to break.",
    };
  }

  if (profile.kind === "horror-thriller") {
    return {
      characterName: `${leadName} Sees the Trap`,
      characterStyle: "Psychological close-up poster",
      characterComposition: `${leadName} framed by ${primaryLocation}, with one object or reflection turning the setting from ordinary to threatening.`,
      characterTagline: "The room knows before you do.",
      characterMood: "Controlled, watched, uneasy",
      characterAppeal: profile.campaignAudience,
      characterPrompt: `Restrained psychological horror poster for ${data.title}, ${leadName} in ${primaryLocation}, ordinary space turning threatening, one key object from JSON, no invented characters.`,
      ensembleName: "Polite Surface, Hidden Rules",
      ensembleStyle: "Social-threat ensemble poster",
      ensembleComposition: `${ensemble} arranged in a socially plausible setting where spacing, gaze, and props reveal control.`,
      ensembleTagline: "Safety has a shape.",
      ensembleMood: "Polite, sickening, precise",
      ensembleAppeal: "Elevated horror and thriller audiences.",
      ensemblePrompt: `Ensemble key art for ${data.title}, social threat, controlled spacing, ${primaryLocation}, characters named in JSON only, no unrelated genre details.`,
      objectName: "The Trigger Object",
      objectStyle: "Minimal threat-object poster",
      objectComposition: `${object} isolated as a clue, trigger, or piece of evidence.`,
      objectTagline: "One detail gives it away.",
      objectMood: "Clinical, ominous, exact",
      objectAppeal: "Viewers who respond to iconic horror objects.",
      objectPrompt: `Minimal horror poster for ${data.title}, ${object} as a threat object, controlled light, negative space, no unrelated props.`,
      locationName: "The Place Turns",
      locationComposition: `${titleCase(primaryLocation)} becomes the campaign image, made uneasy through framing, shadow, and one visible detail from the script.`,
      locationTagline: "The house has rules.",
      locationMood: "Contained, tense, inevitable",
      locationAppeal: profile.campaignAudience,
      titleComposition: "The title held in clean negative space, with one small visual clue interrupting the calm.",
      titleTagline: "Seeing becomes survival.",
      titlePrompt: `Minimal typographic poster for ${data.title}, clean negative space, one visual clue from the screenplay, psychological threat, no unrelated genre language.`,
      mapTagline: "Every room has a purpose.",
    };
  }

  return {
    characterName: `${leadName} Against the System`,
    characterStyle: "Monumental character one-sheet",
    characterComposition: `${leadName} small against ${primaryLocation}, with the key visual pressure from the opening movement.`,
    characterTagline: profile.taglines[0] || "The future is not waiting.",
    characterMood: "Propulsive, isolated, immense",
    characterAppeal: profile.campaignAudience,
    characterPrompt: `Restrained genre poster for ${data.title}, ${leadName} against ${primaryLocation}, ${data.tone}, visible details only from the supplied screenplay JSON, no invented characters or plot events.`,
    ensembleName: "The System in Formation",
    ensembleStyle: "Formal ensemble poster",
    ensembleComposition: `${ensemble} arranged by allegiance, threat, and scale, with ${primaryLocation} implied behind them.`,
    ensembleTagline: profile.taglines[1] || "The world has rules.",
    ensembleMood: "Formal, tense, inevitable",
    ensembleAppeal: profile.campaignAudience,
    ensemblePrompt: `Ensemble key art for ${data.title}, formal arrangement of the major characters named in the JSON, ${primaryLocation}, controlled color, ${data.tone}, no unrelated genre details.`,
    objectName: "The Myth Object",
    objectStyle: "Symbolic object poster",
    objectComposition: `${object} isolated at large scale as a practical object with mythic consequence.`,
    objectTagline: "Small objects carry large worlds.",
    objectMood: "Ritual, precise, ominous",
    objectAppeal: "Viewers who respond to iconic production objects.",
    objectPrompt: `Minimalist poster for ${data.title}, ${object} isolated with dramatic practical importance, restrained negative space, no unrelated props.`,
    locationName: "The World as Pressure",
    locationComposition: `${titleCase(primaryLocation)} becomes the campaign image, with one small figure or object showing the world's scale.`,
    locationTagline: profile.taglines[2] || "Every place has a cost.",
    locationMood: "Immense, quiet, fatalistic",
    locationAppeal: profile.campaignAudience,
    titleComposition: "The title treated like a physical system from the screenplay, with one figure or object moving through the letterforms.",
    titleTagline: "A world inside a name.",
    titlePrompt: `Minimal typographic poster for ${data.title}, title as a physical system tied to the screenplay, one small character silhouette or hero object from the JSON, controlled palette, no unrelated genre language.`,
    mapTagline: "Every place has a cost.",
  };
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
  const profile = textProfile(data);
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
  const frame = buildOverviewFrame(data, profile, lead, centralLocation, firstSetPiece, lastScene);

  return `# ${data.title}

## Logline
${frame.logline}

## Taglines
${frame.taglines.map((tagline) => `- ${tagline}`).join("\n")}

## Synopsis
${frame.synopsis}

## Film Identity
- **Genre:** ${data.genre.join(" / ")}
- **Period:** ${data.setting_period}
- **Tone:** ${data.tone}
- **Core engine:** ${lead?.arc_summary || data.themes.join(", ")}
- **Production read:** ${frame.productionRead}

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
- **Complexity:** ${stuntScenes >= data.scenes.length / 2 ? "High" : "Medium"} scope. ${frame.complexity}`;
}

function buildMoodDocument(data) {
  const profile = textProfile(data);
  const recurringLocations = topBySceneCount(data.locations, "scenes", 3).map((location) => location.name);
  const musicCues = data.scenes.filter((scene) => scene.music_cue).slice(0, 3);
  const soundAnchors = data.scenes
    .filter((scene) => scene.music_cue || scene.props.length || scene.vfx_stunts.length)
    .slice(0, 4);

  return `# Mood & Tone: ${data.title}

## Atmosphere
${buildAtmosphere(data, profile)}

## Tonal Descriptors
${[data.tone, ...profile.descriptors].filter(Boolean).join(" · ")}

## Reference Points
${profile.references.map(([title, note]) => `- **${title}** - ${note}`).join("\n")}

## Music & Sound Direction
${buildSoundDirection(data, profile, recurringLocations, musicCues, soundAnchors)}

### Soundtrack References
${profile.soundtrackReferences.map(([title, note]) => `- **${title}** - ${note}`).join("\n")}

## Color Palette
${profile.palette.map(([name, hex, note]) => `- **${name}** \`${hex}\` - ${note}`).join("\n")}

## Similar Moods
${profile.references.slice(0, 5).map(([title, note]) => `- **${title}** - ${note}`).join("\n")}`;
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
  const profile = textProfile(data);
  const intro = `# Storyboard Prompts: ${data.title}

Each frame is grounded in the supplied scene data and written as a production-use image brief.

## Act 1: Arrival and Suspicion

`;

  const scenes = data.scenes.map((scene) => `### Scene ${scene.scene_number}: ${scene.slug_line}

**Prompt:** ${scene.key_visual_moment} Set the frame in ${scene.location}, with ${list(scene.characters_present).toLowerCase()} present. The image should feel like ${scene.emotional_beat}, with visible production details from the scene: ${list(scene.props.concat(scene.wardrobe_notes), profile.storyFallback)}. Keep the frame disciplined and grounded in the supplied screenplay details. Do not add plot events, characters, creatures, or production history not present in the JSON.

**Camera:** ${scene.int_ext === "EXT" ? "Wide or medium-wide coverage that lets the location pressure the character" : "Controlled medium shot with tight blocking and visible object continuity"}
**Lighting:** ${getLighting(scene)}
**Mood:** ${titleCase(scene.emotional_beat)}
`).join("\n---\n\n");

  return `${intro}${scenes}`;
}

function buildPosterDocument(data) {
  const profile = textProfile(data);
  const lead = topBySceneCount(data.characters, "scenes_present", 1)[0];
  const supporting = topBySceneCount(data.characters, "scenes_present", 4).filter((character) => character.name !== lead?.name);
  const heroProps = data.props_master.filter((prop) => prop.hero_prop);
  const majorScenes = [...data.scenes].sort((a, b) => (b.page_end - b.page_start) - (a.page_end - a.page_start)).slice(0, 3);
  const palette = profile.palette.map(([name, hex]) => [name, hex]);
  const primaryLocation = topBySceneCount(data.locations, "scenes", 1)[0]?.name || "the central location";
  const language = posterLanguage(profile, data, lead, supporting, heroProps, primaryLocation);

  return `# Poster Concepts: ${data.title}

## About This Document
These are key-art directions for a campaign designer. Each concept should read at thumbnail size and stay attached to specific script evidence.

---

## Category: Character-Driven

**Concept 1: ${language.characterName}**
- **Style:** ${language.characterStyle}
- **Composition:** ${language.characterComposition}
- **Color Palette:** ${palette.slice(0, 4).map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Tall, restrained serif title with wide-set sans-serif credits.
- **Tagline:** "${language.characterTagline}"
- **Mood:** ${language.characterMood}
- **Campaign Read:** ${language.characterAppeal}
- **AI Prompt:** ${language.characterPrompt}

**Concept 2: ${language.ensembleName}**
- **Style:** ${language.ensembleStyle}
- **Composition:** ${language.ensembleComposition}
- **Color Palette:** ${palette.map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Architectural, quiet, and ceremonial.
- **Tagline:** "${language.ensembleTagline}"
- **Mood:** ${language.ensembleMood}
- **Campaign Read:** ${language.ensembleAppeal}
- **AI Prompt:** ${language.ensemblePrompt}

## Category: Symbolic / Metaphorical

**Concept 3: ${language.objectName}**
- **Style:** ${language.objectStyle}
- **Composition:** ${language.objectComposition}
- **Color Palette:** ${palette.slice(1, 4).map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Small title, lots of negative space, no decorative texture unless tied to the object.
- **Tagline:** "${language.objectTagline}"
- **Mood:** ${language.objectMood}
- **Campaign Read:** ${language.objectAppeal}
- **AI Prompt:** ${language.objectPrompt}

**Concept 4: ${language.locationName}**
- **Style:** Environmental metaphor poster
- **Composition:** ${language.locationComposition}
- **Color Palette:** ${palette.map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Title embedded low in the environment so scale reads first.
- **Tagline:** "${language.locationTagline}"
- **Mood:** ${language.locationMood}
- **Campaign Read:** ${language.locationAppeal}
- **AI Prompt:** Environmental one-sheet for ${data.title}, ${language.locationComposition.toLowerCase()} Graphic readability at thumbnail size, no invented geography.

## Category: Scene-Based

${majorScenes.map((scene, index) => `**Concept ${index + 5}: Scene ${scene.scene_number} Signal**
- **Style:** Scene-led campaign image
- **Composition:** ${scene.key_visual_moment}
- **Color Palette:** ${palette.slice(index, index + 3).map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Title clear at thumbnail size, secondary copy minimal.
- **Tagline:** "${profile.sceneTaglines[index] || "The moment changes the film."}"
- **Mood:** ${titleCase(scene.emotional_beat)}
- **Campaign Read:** Viewers who want one memorable scripted moment as the campaign hook.
- **AI Prompt:** Key art for ${data.title}, Scene ${scene.scene_number}: ${scene.key_visual_moment} Keep only characters and objects named in the script data, no extra plot details.`).join("\n\n")}

## Category: Minimalist / Typographic

**Concept 8: The Title as Terrain**
- **Style:** Typographic conceptual poster
- **Composition:** ${language.titleComposition}
- **Color Palette:** ${palette.slice(0, 3).map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Massive serif or chiseled sans-serif, quiet spacing, no distressed effects.
- **Tagline:** "${language.titleTagline}"
- **Mood:** Iconic, austere, memorable
- **Campaign Read:** ${profile.campaignAudience}.
- **AI Prompt:** ${language.titlePrompt}

**Concept 9: The Production Map**
- **Style:** Production-design one-sheet
- **Composition:** A restrained map of ${data.locations.slice(0, 4).map((location) => location.name).join(", ")}, with one object or event marker per location.
- **Color Palette:** ${palette.map(([name, hex]) => `${hex} (${name})`).join(", ")}
- **Typography:** Information-design clarity with cinematic restraint.
- **Tagline:** "${language.mapTagline}"
- **Mood:** Designed, strategic, expansive
- **Campaign Read:** Viewers interested in production design and story structure.
- **AI Prompt:** Elegant production-map poster for ${data.title}, restrained map of the script's major locations with small object or event markers from the JSON, no invented geography.`;
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

async function readProjectFromModule(modulePath) {
  const source = await readFile(path.resolve(process.cwd(), modulePath), "utf8");
  const match = source.match(/=\s*({[\s\S]*});\s*$/);
  if (!match) {
    throw new Error(`Could not read project object from ${modulePath}`);
  }

  return JSON.parse(match[1]);
}

function imageMapsFromProject(project) {
  return {
    images: project.images || {},
    posterImages: project.posterImages || {},
    portraits: project.portraits || {},
    propImages: project.propImages || {},
  };
}

function parseArgs(args) {
  const flags = new Set();
  const optionValues = new Map();
  const positional = [];

  for (const arg of args) {
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const separatorIndex = arg.indexOf("=");
    if (separatorIndex === -1) {
      flags.add(arg);
      continue;
    }

    optionValues.set(arg.slice(0, separatorIndex), arg.slice(separatorIndex + 1));
  }

  return { flags, optionValues, positional };
}

function savedProjectImportPath(destination) {
  const reportsPath = path.join(process.cwd(), "lib", "reports");
  const relativePath = path.relative(path.dirname(destination), reportsPath).replaceAll(path.sep, "/");
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

async function writeDemoModule({ data, jsonData, documents, images, slug, exportName, outputFile }) {
  const destination = outputFile
    ? path.resolve(process.cwd(), outputFile)
    : path.join(process.cwd(), "lib", "demos", `${slug}.ts`);

  await mkdir(path.dirname(destination), { recursive: true });

  const project = {
    title: data.title,
    createdAt: new Date().toISOString(),
    jsonData,
    documents,
    ...images,
  };

  const content = `// Auto-generated by prompt-tests/scripts/build-demo-fixture.mjs.
// Image URLs point to committed files in public/demo-images/${slug}/.

import type { SavedProject } from "${savedProjectImportPath(destination)}";

export const ${exportName}: SavedProject = ${JSON.stringify(project, null, 2)};
`;

  await writeFile(destination, content);
  return path.relative(process.cwd(), destination);
}

async function main() {
  const { flags, optionValues, positional } = parseArgs(process.argv.slice(2));
  const [inputPath, slug, exportName] = positional;
  if (!inputPath || !slug || !exportName) usage();
  if (positional.length !== 3) usage();
  if (flags.has("--force-images") && flags.has("--reuse-images")) usage();

  const allowedFlags = ["--force-images", "--reuse-images"];
  const allowedOptions = ["--preserve-images-from", "--output-file"];
  const unknownFlags = [...flags].filter((flag) => !allowedFlags.includes(flag));
  const unknownOptions = [...optionValues.keys()].filter((option) => !allowedOptions.includes(option));
  if (unknownFlags.length > 0 || unknownOptions.length > 0) usage();

  const imageMode = flags.has("--force-images") ? "force" : flags.has("--reuse-images") ? "reuse" : "fresh";
  const preserveImagesFrom = optionValues.get("--preserve-images-from");
  const outputFile = optionValues.get("--output-file");

  const baseUrl = process.env.GREENLIGHT_BASE_URL || DEFAULT_BASE_URL;
  const rawJsonData = await readFile(inputPath, "utf8");
  const data = normalizeData(JSON.parse(rawJsonData));
  const jsonData = JSON.stringify(data, null, 2);
  validateScreenplayData(data);

  log(`Building demo fixture for ${data.title} from ${inputPath}`);
  log(`Using ${baseUrl}`);
  log(`Image mode: ${imageMode}`);

  const documents = await generateDocuments({ baseUrl, jsonData });
  const images = preserveImagesFrom
    ? imageMapsFromProject(await readProjectFromModule(preserveImagesFrom))
    : await generateImages({ baseUrl, data, documents, slug, imageMode });
  const outputPath = await writeDemoModule({ data, jsonData, documents, images, slug, exportName, outputFile });

  log(`Done: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
