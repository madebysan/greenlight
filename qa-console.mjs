// QA Console Check: navigate all wizard steps and capture console errors
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const errors = [];
const warnings = [];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({ text: msg.text(), url: page.url() });
    }
    if (msg.type() === "warning") {
      warnings.push({ text: msg.text(), url: page.url() });
    }
  });

  // Capture page errors
  page.on("pageerror", (err) => {
    errors.push({ text: err.message, url: page.url() });
  });

  console.log("--- Step 1: Instructions ---");
  await page.goto(BASE);
  await page.waitForSelector("text=Step 1: Extract Screenplay Data");
  console.log("  Page loaded OK");

  // Check copy button exists
  const copyBtn = await page.$("text=Copy Prompt");
  console.log("  Copy Prompt button:", copyBtn ? "found" : "MISSING");

  // Check next button
  const nextBtn = await page.$('text=I have my JSON');
  console.log("  Next button:", nextBtn ? "found" : "MISSING");

  // Navigate to Step 2
  await nextBtn.click();
  await page.waitForSelector("text=Step 2: Paste Your JSON");
  console.log("\n--- Step 2: JSON Input ---");
  console.log("  Page loaded OK");

  // Test empty submit
  const generateBtn = await page.$("text=Generate Documents");
  await generateBtn.click();
  const errorMsg = await page.$("text=Please paste your JSON data");
  console.log("  Empty submit validation:", errorMsg ? "works" : "MISSING");

  // Test invalid JSON
  await page.fill("#json-input", "not valid json");
  await generateBtn.click();
  const jsonError = await page.$("text=Invalid JSON");
  console.log("  Invalid JSON validation:", jsonError ? "works" : "MISSING");

  // Test valid JSON with missing fields
  await page.fill("#json-input", '{"foo": "bar"}');
  await generateBtn.click();
  const schemaError = await page.$("text=Validation errors");
  console.log("  Schema validation:", schemaError ? "works" : "MISSING");

  // Test back button
  const backBtn = await page.$("text=Back");
  await backBtn.click();
  await page.waitForSelector("text=Step 1: Extract Screenplay Data");
  console.log("  Back button: works");

  // Navigate forward again and submit valid JSON (won't call API, just check step 3 renders)
  await page.click('text=I have my JSON');
  await page.waitForSelector("text=Step 2");

  // Fill with minimal valid JSON
  const testJson = JSON.stringify({
    title: "QA Test",
    genre: ["Test"],
    setting_period: "Now",
    total_pages: 10,
    scenes: [{ scene_number: 1, slug_line: "INT. TEST - DAY", location: "test", int_ext: "INT", time_of_day: "DAY", page_start: 1, page_end: 2, characters_present: ["TESTER"], key_visual_moment: "test", emotional_beat: "test", props: [], wardrobe_notes: [], vfx_stunts: [], music_cue: "", notes: "" }],
    characters: [{ name: "TESTER", description: "test", arc_summary: "test", scenes_present: [1], special_requirements: [], wardrobe_changes: 0 }],
    locations: [{ name: "test", description: "test", scenes: [1], int_ext: "INT", time_variations: ["DAY"], set_requirements: [] }],
    props_master: [],
    themes: ["test"],
    tone: "test",
  });

  await page.fill("#json-input", testJson);
  await page.click("text=Generate Documents");

  // Step 3 should render with generating state
  await page.waitForSelector("text=Generating Documents");
  console.log("\n--- Step 3: Generating ---");
  console.log("  Generation screen loaded OK");

  // Check all 5 doc names appear
  const docNames = ["Scene Breakdown", "Production Matrices", "Marketing Brief", "Storyboard Prompts", "Poster Concepts"];
  for (const name of docNames) {
    const el = await page.$(`text=${name}`);
    console.log(`  ${name}:`, el ? "found" : "MISSING");
  }

  // Wait for generation to complete (or timeout)
  console.log("  Waiting for generation (60s timeout)...");
  try {
    await page.waitForSelector("text=Your Documents", { timeout: 60000 });
    console.log("\n--- Step 4: Results ---");
    console.log("  Results page loaded OK");

    // Check tabs exist
    for (const name of docNames) {
      const tab = await page.$(`text=${name}`);
      console.log(`  Tab ${name}:`, tab ? "found" : "MISSING");
    }

    // Check download buttons
    const downloadBtn = await page.$("text=Download as .md");
    console.log("  Download button:", downloadBtn ? "found" : "MISSING");

    const startOverBtn = await page.$("text=Start Over");
    console.log("  Start Over button:", startOverBtn ? "found" : "MISSING");

  } catch {
    console.log("  Generation timed out (expected if no API key or rate limit)");
    // Check if we got error states instead
    const errorElements = await page.$$("text=error");
    console.log(`  Error states found: ${errorElements.length}`);
  }

  console.log("\n=== RESULTS ===");
  console.log(`Errors: ${errors.length}`);
  errors.forEach((e) => console.log(`  ERROR: ${e.text} (${e.url})`));
  console.log(`Warnings: ${warnings.length}`);
  warnings.forEach((w) => console.log(`  WARN: ${w.text} (${w.url})`));

  await browser.close();
}

run().catch((e) => {
  console.error("QA FAILED:", e.message);
  process.exit(1);
});
