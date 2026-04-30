import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:4174";
const outputDir = new URL("../artifacts/", import.meta.url);

const viewports = [
  { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false },
  { name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true },
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
  });
  const page = await context.newPage();
  const trackCount = 3;

  page.on("console", (message) => {
    if (message.type() === "error") {
      page.consoleErrors ??= [];
      page.consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    page.consoleErrors ??= [];
    page.consoleErrors.push(error.message);
  });

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    page.consoleErrors = [];
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForSelector("#gameCanvas");
    await page.waitForTimeout(900);

    const menuPixels = await readCanvasPixels(page);
    await page.locator(".track-card").nth(trackIndex).click();
    await page.waitForTimeout(3400);

    const trackName = (await page.locator("#trackName").textContent())?.trim() ?? `track-${trackIndex + 1}`;
    const progressBefore = await numericProgress(page);
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(1600);
    await page.keyboard.up("KeyW");
    await page.waitForTimeout(250);

    const progressAfter = await numericProgress(page);
    const racePixels = await readCanvasPixels(page);
    const slug = trackName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const screenshotPath = fileURLToPath(new URL(`${viewport.name}-${slug}.png`, outputDir));
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const errors = [];
    if (page.consoleErrors.length) errors.push(`console errors: ${page.consoleErrors.join(" | ")}`);
    if (menuPixels.nonEmptyRatio < 0.18) errors.push(`menu canvas too empty: ${menuPixels.nonEmptyRatio}`);
    if (racePixels.nonEmptyRatio < 0.18) errors.push(`race canvas too empty: ${racePixels.nonEmptyRatio}`);
    if (!(progressAfter > progressBefore)) {
      errors.push(`race did not move: ${progressBefore} -> ${progressAfter}`);
    }

    results.push({
      viewport: viewport.name,
      track: trackName,
      menuPixels,
      racePixels,
      progressBefore,
      progressAfter,
      screenshot: screenshotPath,
      errors,
    });
  }

  await context.close();
}

await browser.close();

for (const result of results) {
  console.log(
    `${result.viewport} ${result.track}: canvas ${result.racePixels.width}x${result.racePixels.height}, ` +
      `pixels ${Math.round(result.racePixels.nonEmptyRatio * 100)}%, ` +
      `progress ${result.progressBefore}% -> ${result.progressAfter}%, ` +
      `screenshot ${result.screenshot}`,
  );
}

const failures = results.flatMap((result) =>
  result.errors.map((error) => `${result.viewport} ${result.track}: ${error}`),
);

if (failures.length) {
  throw new Error(failures.join("\n"));
}

async function numericProgress(page) {
  const text = await page.locator("#progressReadout").textContent();
  return Number.parseFloat(text ?? "0") || 0;
}

async function readCanvasPixels(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("#gameCanvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      return { width: canvas.width, height: canvas.height, nonEmptyRatio: 0 };
    }

    const sampleWidth = Math.min(96, canvas.width);
    const sampleHeight = Math.min(96, canvas.height);
    const x = Math.max(0, Math.floor((canvas.width - sampleWidth) / 2));
    const y = Math.max(0, Math.floor((canvas.height - sampleHeight) / 2));
    const pixels = new Uint8Array(sampleWidth * sampleHeight * 4);
    gl.readPixels(x, y, sampleWidth, sampleHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let nonEmpty = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const total = pixels[i] + pixels[i + 1] + pixels[i + 2];
      if (pixels[i + 3] > 0 && total > 30) nonEmpty += 1;
    }

    return {
      width: canvas.width,
      height: canvas.height,
      nonEmptyRatio: nonEmpty / (sampleWidth * sampleHeight),
    };
  });
}
