// Visual QA: Screenshot each wizard step at desktop and mobile viewports
import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });

  // Desktop screenshots
  console.log("=== Desktop (1440px) ===");
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktop.newPage();

  await dPage.goto(BASE);
  await dPage.waitForSelector("text=Step 1");
  await dPage.screenshot({ path: "screenshots/step1-instructions-desktop.png", fullPage: true });
  console.log("  Step 1 captured");

  await dPage.click("text=I have my JSON");
  await dPage.waitForSelector("text=Step 2");
  await dPage.screenshot({ path: "screenshots/step2-json-input-desktop.png", fullPage: true });
  console.log("  Step 2 captured");

  // Fill with invalid JSON to capture error state
  await dPage.fill("#json-input", "not json");
  await dPage.click("text=Generate Documents");
  await dPage.waitForSelector("text=Validation errors");
  await dPage.screenshot({ path: "screenshots/step2-validation-error-desktop.png", fullPage: true });
  console.log("  Step 2 (error state) captured");

  await desktop.close();

  // Mobile screenshots
  console.log("\n=== Mobile (375px) ===");
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mPage = await mobile.newPage();

  await mPage.goto(BASE);
  await mPage.waitForSelector("text=Step 1");
  await mPage.screenshot({ path: "screenshots/step1-instructions-mobile.png", fullPage: true });
  console.log("  Step 1 captured");

  await mPage.click("text=I have my JSON");
  await mPage.waitForSelector("text=Step 2");
  await mPage.screenshot({ path: "screenshots/step2-json-input-mobile.png", fullPage: true });
  console.log("  Step 2 captured");

  await mobile.close();
  await browser.close();

  console.log("\nScreenshots saved to screenshots/");
}

run().catch((e) => {
  console.error("Visual QA FAILED:", e.message);
  process.exit(1);
});
