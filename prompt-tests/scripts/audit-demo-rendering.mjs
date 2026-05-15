import { createRequire } from "node:module";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);

const BASE_URL = process.env.GREENLIGHT_AUDIT_BASE_URL || "https://greenlight.santiagoalonso.com";

const DEMOS = [
  { slug: "red-balloon", project: require("../../lib/demos/red-balloon.ts").RED_BALLOON_PROJECT },
  { slug: "get-out", project: require("../../lib/demos/get-out.ts").GET_OUT_PROJECT },
  { slug: "dune-part-one", project: require("../../lib/demos/dune-part-one.ts").DUNE_PART_ONE_PROJECT },
  { slug: "the-favourite", project: require("../../lib/demos/the-favourite.ts").THE_FAVOURITE_PROJECT },
  { slug: "past-lives", project: require("../../lib/demos/past-lives.ts").PAST_LIVES_PROJECT },
];

const TABS = [
  { label: "Overview", required: ["Story in brief", "Core Themes", "Production footprint"] },
  { label: "Mood & Tone", required: ["Reference Points", "Music & Sound", "Soundtrack References", "Similar Moods"] },
  { label: "Scenes", required: ["At a Glance", "Scenes"] },
  { label: "Locations", required: ["Places With the Most Story Weight", "Schedule Pressure"] },
  { label: "Cast & Crew", required: ["Cast & Crew"] },
  { label: "Production Design", required: ["Production Design"] },
  { label: "Title & Palette", required: ["Title & Palette"] },
  { label: "Poster Concepts", required: ["Poster Concepts"] },
];

const BAD_TEXT_PATTERNS = [
  { label: "undefined", pattern: /\bundefined\b/i },
  { label: "NaN", pattern: /\bNaN\b/ },
  { label: "[object Object]", pattern: /\[object Object\]/ },
  { label: "Primary Location", pattern: /\bPrimary Location\b/i },
];

function getDoc(project, slug) {
  return project.documents.find((doc) => doc.slug === slug)?.content || "";
}

function normalizeText(value) {
  return value
    .replace(/[*_`"“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionBody(markdown, headingPattern) {
  const sections = markdown.split(/^## /m).slice(1);
  for (const section of sections) {
    const [heading, ...bodyLines] = section.split("\n");
    if (headingPattern.test(heading.trim())) {
      return bodyLines.join("\n").trim();
    }
  }
  return "";
}

function listTitles(markdown, headingPattern) {
  return sectionBody(markdown, headingPattern)
    .split("\n")
    .map((line) => line.match(/^-\s+\*\*([^*]+)\*\*/)?.[1])
    .filter(Boolean)
    .map((title) => normalizeText(title).replace(/\s+\(\d{4}\)$/, ""));
}

function soundtrackTitles(markdown) {
  const music = sectionBody(markdown, /music|sound/i);
  const soundtrack = music.split(/^###\s+Soundtrack References/im)[1] || "";
  return soundtrack
    .split("\n")
    .map((line) => line.match(/^-\s+\*\*([^*]+)\*\*/)?.[1])
    .filter(Boolean)
    .map((title) => normalizeText(title).replace(/\s+\(\d{4}\)$/, ""));
}

function sceneFieldSamples(sceneDoc) {
  const matches = [...sceneDoc.matchAll(/-\s+\*\*(Key Visual Moment|Emotional Beat|Props|Wardrobe|VFX\/Stunts|Notes):\*\*[ \t]+([^\n]+)/g)];
  return matches
    .map((match) => normalizeText(match[2]))
    .filter((value) => value && value !== "None" && value !== "Standard")
    .slice(0, 24);
}

function requiredSourceSnippets(project) {
  const overview = getDoc(project, "overview");
  const mood = getDoc(project, "mood-and-tone");
  const scenes = getDoc(project, "scene-breakdown");
  const poster = getDoc(project, "poster-concepts");
  const snippets = {
    "Overview": [
      normalizeText(sectionBody(overview, /logline/i)).slice(0, 80),
      ...listTitles(overview, /themes/i).slice(0, 3),
    ],
    "Mood & Tone": [
      ...listTitles(mood, /reference/i).slice(0, 3),
      ...soundtrackTitles(mood).slice(0, 3),
      ...listTitles(mood, /similar/i).slice(0, 3),
    ],
    "Scenes": sceneFieldSamples(scenes),
    "Poster Concepts": [...poster.matchAll(/\*\*Concept \d+:\s*(.+?)\*\*/g)]
      .map((match) => normalizeText(match[1]))
      .slice(0, 3),
  };
  return Object.fromEntries(
    Object.entries(snippets).map(([key, values]) => [
      key,
      values.filter(Boolean).map((value) => value.slice(0, 80)),
    ]),
  );
}

async function clickTab(page, tabLabel) {
  const tab = page
    .locator('nav[aria-label="Report sections"] > button')
    .filter({ hasText: tabLabel })
    .first();
  await tab.click({ timeout: 15_000 });
  await page.waitForTimeout(350);
}

async function auditDemo(page, slug, project) {
  const url = `${BASE_URL}/demo/${slug}`;
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  const sourceSnippets = requiredSourceSnippets(project);
  const failures = [];
  const tabResults = [];

  if (!response || response.status() !== 200) {
    failures.push(`route returned ${response?.status() ?? "no response"}`);
  }

  for (const tab of TABS) {
    await clickTab(page, tab.label);

    if (tab.label === "Scenes") {
      const expandAll = page.getByRole("button", { name: /Expand all/i });
      if (await expandAll.count()) {
        await expandAll.click();
        await page.waitForTimeout(350);
      }
    }

    const body = await page.locator("body").innerText();
    const normalizedBody = normalizeText(body).toLowerCase();
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const missingRequired = tab.required.filter((label) => !normalizedBody.includes(normalizeText(label).toLowerCase()));
    const badText = BAD_TEXT_PATTERNS.filter(({ pattern }) => pattern.test(body)).map(({ label }) => label);
    const snippets = sourceSnippets[tab.label] || [];
    const missingSnippets = snippets.filter(
      (snippet) => snippet && !normalizedBody.includes(normalizeText(snippet).toLowerCase()),
    );

    if (missingRequired.length) {
      failures.push(`${tab.label}: missing UI headings ${missingRequired.join(", ")}`);
    }
    if (badText.length) {
      failures.push(`${tab.label}: rendered bad placeholder text ${badText.join(", ")}`);
    }
    if (horizontalOverflow) {
      failures.push(`${tab.label}: horizontal overflow`);
    }
    if (missingSnippets.length) {
      failures.push(`${tab.label}: source snippets not rendered ${missingSnippets.slice(0, 5).join(" | ")}`);
    }

    tabResults.push({
      tab: tab.label,
      checkedSnippets: snippets.length,
      missingRequired,
      missingSnippets: missingSnippets.length,
      horizontalOverflow,
      badText,
    });
  }

  return {
    slug,
    status: response?.status() ?? null,
    ok: failures.length === 0,
    failures,
    tabs: tabResults,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const results = [];

  for (const demo of DEMOS) {
    results.push(await auditDemo(page, demo.slug, demo.project));
  }

  await browser.close();

  const failed = results.filter((result) => !result.ok);
  console.log(JSON.stringify({ baseUrl: BASE_URL, ok: failed.length === 0, results }, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
