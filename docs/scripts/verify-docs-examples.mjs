/**
 * Verifies that every docs example of one framework renders on a running docs site.
 *
 * Scans `docs/content/guides` for `::: example … :<framework>` blocks, then drives
 * every `/<framework>-data-grid/<page>/` with Playwright/Chromium. For each example
 * it waits for the loading shimmer to clear (the example-runner removes it once
 * the Angular component bootstraps), asserts a Handsontable grid rendered inside
 * the example container, records the rendered data-row count, and captures
 * uncaught page errors and console errors.
 *
 * Usage:
 *   FRAMEWORK=angular node scripts/verify-docs-examples.mjs
 *
 * Environment variables:
 *   FRAMEWORK   – angular (default) | vue | react
 *   BASE_URL    – docs origin incl. the /docs prefix (default http://localhost:4321/docs)
 *   OUT_FILE    – JSON results path (default ./<framework>-examples-results.json)
 *   CHROME_BIN  – Chromium executable override (else Playwright's default resolution)
 *   CONCURRENCY – parallel pages (default 4)
 *
 * Exit code: 0 when every example passes, 1 otherwise.
 */
import { chromium } from '@playwright/test';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRAMEWORKS = {
  angular: { marker: /:::\s*example[^\n]*:angular\b/, urlPrefix: 'angular-data-grid' },
  vue: { marker: /:::\s*example[^\n]*:vue3?\b/, urlPrefix: 'vue-data-grid' },
  react: { marker: /:::\s*example[^\n]*:react\b/, urlPrefix: 'react-data-grid' },
};
const FRAMEWORK = process.env.FRAMEWORK ?? 'angular';

if (!FRAMEWORKS[FRAMEWORK]) {
  throw new Error(`Unknown FRAMEWORK "${FRAMEWORK}" — expected one of: ${Object.keys(FRAMEWORKS).join(', ')}`);
}

const { marker: EXAMPLE_MARKER, urlPrefix: URL_PREFIX } = FRAMEWORKS[FRAMEWORK];
const BASE = process.env.BASE_URL ?? 'http://localhost:4321/docs';
const OUT_FILE = process.env.OUT_FILE ?? `./${FRAMEWORK}-examples-results.json`;
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 4);
const GUIDES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'guides');

// Errors expected in a no-backend environment — same list as recipeConsoleErrors.spec.ts.
const IGNORED_ERROR_PATTERNS = [
  /net::ERR_/i,
  /Failed to load resource/i,
  /Failed to fetch/i,
  /AbortError/i,
  /NetworkError/i,
  /Load failed/i,
  /^HTTP \d{3}$/,
  /Outdated Optimize Dep/i,
  /csb\.app/i,
  /codesandbox\.io/i,
];
const shouldIgnore = message => IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(message));

/**
 * Collects every guide page that embeds at least one example of the selected framework.
 *
 * @param {string} dir - Directory to scan recursively.
 * @param {Array} acc - Accumulator for the collected pages.
 * @returns {Array<{ permalink: string, ids: string[] }>} Pages with their example IDs.
 */
function collectFrameworkPages(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      collectFrameworkPages(full, acc);
    } else if (entry.name.endsWith('.md')) {
      const text = readFileSync(full, 'utf8');
      const permalink = text.match(/^permalink:\s*(\S+)/m)?.[1];

      if (!permalink) continue;

      const ids = [];

      for (const line of text.split('\n')) {
        if (EXAMPLE_MARKER.test(line)) {
          // Unnamed example blocks render with the fallback container ID "unknown".
          ids.push(line.match(/#(\S+)/)?.[1] ?? 'unknown');
        }
      }

      if (ids.length) acc.push({ permalink, ids });
    }
  }

  return acc;
}

const pages = collectFrameworkPages(GUIDES_DIR).sort((a, b) => a.permalink.localeCompare(b.permalink));
const results = [];

const browser = await chromium.launch(
  process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {},
);

/**
 * Checks a single docs page and all of its examples for the selected framework.
 *
 * @param {{ permalink: string, ids: string[] }} pageInfo - Page permalink and expected example IDs.
 */
async function checkPage({ permalink, ids }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', (err) => {
    if (!shouldIgnore(String(err))) errors.push(`pageerror: ${err}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !shouldIgnore(msg.text())) errors.push(`console: ${msg.text()}`);
  });
  await context.addCookies([{
    name: 'CookieConsent',
    value: '-2',
    domain: new URL(BASE).hostname,
    path: '/',
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);

  const url = `${BASE}/${URL_PREFIX}${permalink}/`;
  const pageResult = { permalink, url, examples: [], pageErrors: errors };

  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    if (!resp || resp.status() >= 400) {
      pageResult.examples = ids.map(id => ({ id, status: 'FAIL', detail: `HTTP ${resp?.status()}` }));
      results.push(pageResult);
      await context.close();

      return;
    }

    for (const id of ids) {
      const container = page.locator(`#hot-example-${id}`);
      const entry = { id, status: 'PASS', detail: '' };

      try {
        await container.waitFor({ state: 'attached', timeout: 15000 });
        // The shimmer clears only after the Angular component bootstraps.
        await page.waitForSelector(
          `#hot-example-${id} .hot-example-preview:not(.hot-example-preview--loading)`,
          { timeout: 90000 },
        );
        await container.scrollIntoViewIfNeeded();
        await container.locator('.handsontable .htCore').first().waitFor({ state: 'attached', timeout: 30000 });

        entry.rows = await container.locator('.ht_master .htCore tbody tr').count();

        if (entry.rows === 0) {
          entry.status = 'WARN';
          entry.detail = 'grid mounted but 0 data rows rendered';
        }
      } catch (error) {
        entry.status = 'FAIL';
        entry.detail = String(error).split('\n')[0].slice(0, 300);
      }
      pageResult.examples.push(entry);
    }

    // Let late async errors surface before closing the page.
    await page.waitForTimeout(1500);
  } catch (error) {
    pageResult.examples = ids.map(id => ({ id, status: 'FAIL', detail: `nav: ${String(error).slice(0, 200)}` }));
  }

  results.push(pageResult);
  await context.close();
}

const queue = [...pages];

await Promise.all(Array.from({ length: CONCURRENCY }, async() => {
  while (queue.length) {
    const pageInfo = queue.shift();

    // eslint-disable-next-line no-console
    console.log(`checking ${pageInfo.permalink} (${pageInfo.ids.length} examples)…`);
    await checkPage(pageInfo);
  }
}));

await browser.close();

results.sort((a, b) => a.permalink.localeCompare(b.permalink));
writeFileSync(OUT_FILE, JSON.stringify(results, null, 1));

let pass = 0;
let warn = 0;
let fail = 0;

for (const result of results) {
  for (const example of result.examples) {
    if (example.status === 'PASS') pass += 1;
    else if (example.status === 'WARN') warn += 1;
    else fail += 1;

    if (example.status !== 'PASS') {
      // eslint-disable-next-line no-console
      console.log(`${example.status} ${result.permalink}#${example.id} — ${example.detail}`);
    }
  }

  if (result.pageErrors.length) {
    // eslint-disable-next-line no-console
    console.log(`PAGE-ERRORS ${result.permalink}: ${result.pageErrors.slice(0, 5).join(' | ').slice(0, 500)}`);
  }
}

// eslint-disable-next-line no-console
console.log(`\nTOTAL pass=${pass} warn=${warn} fail=${fail}`);
process.exitCode = fail > 0 ? 1 : 0;
