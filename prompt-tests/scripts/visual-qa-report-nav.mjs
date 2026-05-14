import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.GREENLIGHT_QA_URL || "http://localhost:3000/demo";
const outDir = path.resolve(
  process.env.GREENLIGHT_QA_OUT || "prompt-tests/runs/report-section-nav-qa-2026-05-14",
);

const tabs = [
  "Overview",
  "Mood & Tone",
  "Scenes",
  "Locations",
  "Cast & Crew",
  "Production Design",
  "Title & Palette",
  "Poster Concepts",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1399, height: 1249 },
  deviceScaleFactor: 1,
});

fs.mkdirSync(outDir, { recursive: true });

const logs = [];
page.on("console", (msg) => {
  if (["error", "warning"].includes(msg.type())) {
    logs.push(`${msg.type()}: ${msg.text()}`);
  }
});
page.on("pageerror", (err) => logs.push(`pageerror: ${err.message}`));

const response = await page.goto(BASE_URL, {
  waitUntil: "networkidle",
  timeout: 60000,
});

const results = [];
for (const label of tabs) {
  await page
    .getByRole("button", { name: new RegExp(escapeRegExp(label), "i") })
    .first()
    .click();
  await page.waitForTimeout(450);

  const nav = page.locator('nav[aria-label="Adjacent report sections"]');
  await nav.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: path.join(outDir, `${slugify(label)}-bottom.png`),
    fullPage: false,
  });

  const metrics = await page.evaluate(() => {
    const navEl = document.querySelector('nav[aria-label="Adjacent report sections"]');
    const buttons = navEl ? Array.from(navEl.querySelectorAll("button")) : [];
    const ctas = buttons.map((button) => {
      const rect = button.getBoundingClientRect();
      return {
        text: (button.textContent || "").replace(/\s+/g, " ").trim(),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
      };
    });

    return {
      h1: document.querySelector("h1")?.textContent || "",
      ctaCount: buttons.length,
      ctas,
      horizontalOverflow: document.body.scrollWidth > window.innerWidth + 1,
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });

  results.push({ label, ...metrics });
}

const filteredLogs = logs.filter((line) => !line.includes("Agentation"));
const summary = {
  url: BASE_URL,
  status: response?.status() ?? null,
  logs: filteredLogs,
  results,
};

fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));
await browser.close();

console.log(
  JSON.stringify(
    {
      outDir,
      status: summary.status,
      results: results.map((result) => ({
        label: result.label,
        ctaCount: result.ctaCount,
        overflow: result.horizontalOverflow,
        ctas: result.ctas.map((cta) => cta.text),
      })),
      logs: filteredLogs,
    },
    null,
    2,
  ),
);
