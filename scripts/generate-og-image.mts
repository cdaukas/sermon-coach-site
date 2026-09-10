/**
 * Renders scripts/og-card.html to a 1200x630 PNG.
 *
 * Run this on a machine that has the site serif installed. The card is set in
 * "Iowan Old Style", which ships with macOS; a machine without it falls back
 * through Charter and Georgia to Times New Roman, and the card would then show
 * typography no visitor sees.
 *
 *   npm run og:image                 # writes public/og-image.png
 *   npm run og:image -- /tmp/try.png # writes somewhere else, to preview first
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARD = path.join(__dirname, "og-card.html");
const DEFAULT_OUT = path.join(__dirname, "..", "public", "og-image.png");

async function main() {
  const out = path.resolve(process.argv[2] ?? DEFAULT_OUT);
  await fs.access(CARD);

  const browser = await puppeteer.launch({
    // Honour PUPPETEER_EXECUTABLE_PATH when it is set, so the script also runs
    // in a container with a preinstalled Chromium.
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox"],
  });

  try {
    const page = await browser.newPage();
    // deviceScaleFactor 1: Open Graph wants exactly 1200x630, not a 2x image.
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.goto(`file://${CARD}`, { waitUntil: "load" });
    await page.evaluateHandle("document.fonts.ready");

    /* Whether the site serif actually resolved. document.fonts.check() is not
       trustworthy for local faces, so measure instead: set the same string in
       the site stack and in Times New Roman alone. Identical widths mean the
       stack fell all the way through and the card is in the wrong face. */
    const used = await page.evaluate(() => {
      const el = document.querySelector(".brand") as HTMLElement;
      const probe = document.createElement("span");
      probe.textContent = el.textContent;
      probe.style.cssText =
        "position:absolute;visibility:hidden;white-space:nowrap;" +
        "font-size:92px;font-weight:700;letter-spacing:-0.015em;" +
        'font-family:"Times New Roman",serif';
      document.body.append(probe);
      const fallbackWidth = probe.getBoundingClientRect().width;
      probe.remove();
      // A Range, not the element: .brand is a full-width block, so its own
      // rect is the container width and says nothing about the face.
      const range = document.createRange();
      range.selectNodeContents(el);
      return {
        family: getComputedStyle(el).fontFamily,
        width: Math.round(range.getBoundingClientRect().width),
        fallbackWidth: Math.round(fallbackWidth),
      };
    });

    await page.screenshot({ path: out, type: "png" });
    const { size } = await fs.stat(out);
    console.log(`wrote ${out}`);
    console.log(`  1200x630, ${(size / 1024).toFixed(0)} KB`);
    console.log(`  "Sermon Coach" set at ${used.width}px wide`);
    const fellThrough = used.width === used.fallbackWidth;
    console.log(
      fellThrough
        ? `  WRONG FACE: identical to Times New Roman at ${used.fallbackWidth}px, so ` +
            "none of Iowan Old Style, Charter or Georgia resolved on this machine. " +
            "Run this on a Mac and re-render before committing."
        : `  Site serif resolved: Times New Roman would be ${used.fallbackWidth}px.`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
