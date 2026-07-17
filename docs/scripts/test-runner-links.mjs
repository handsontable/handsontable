// Verifies every "Open in runner" link (demos.handsontable.com/?docs=...) that
// framework-loader.mjs emits into the built docs HTML.
//
// Two phases:
// 1. Static: walk the built dist/ HTML, extract every runner href, and cross-check
//    each docs path against the runner's manifest.json. A path missing from the
//    manifest is a guaranteed failure — the runner silently falls back to a
//    generic starter project for unknown paths instead of erroring, so this is
//    the only fast, deterministic way to catch that.
// 2. Headless (skipped with --static-only): load each link in Chromium and
//    confirm a Handsontable grid actually rendered. A rendered grid alone isn't
//    proof of correctness — the fallback starter also renders a (different,
//    generic) grid — so this also asserts the page displays the example's own
//    guideTitle + exampleTitle from the manifest, which the fallback never does.
//
// Usage: node scripts/test-runner-links.mjs [options]

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

// The build pipeline's HTML serializer re-escapes "&" inconsistently depending
// on where the markup passes through it — plain "&", the named entity
// "&amp;", and the numeric entity "&#x26;" have all been observed in built
// output — so every form must be accepted here.
const RUNNER_LINK_RE = /href="(https:\/\/demos\.handsontable\.com\/\?docs=([^"&]+))(?:&(?:amp;|#x26;)?v=([^"&]+))?"/gi;

const TIER1_FRAMEWORKS = new Set(['javascript', 'typescript', 'react']);
const TIER2_FRAMEWORKS = new Set(['vue', 'angular']);
const TIER_TIMEOUTS_MS = { javascript: 60_000, typescript: 60_000, react: 60_000, vue: 120_000, angular: 240_000 };

const IGNORED_CONSOLE_PATTERNS = [
  /net::ERR_/i,
  /Failed to load resource/i,
  /Failed to fetch/i,
  /AbortError/i,
  /NetworkError/i,
  /Outdated Optimize Dep/i,
  /csb\.app/i,
  /codesandbox\.io/i,
];

/**
 * Extracts every demos.handsontable.com runner href from one HTML document.
 *
 * @param {string} html
 * @returns {{ docsPath: string, version: string | null, url: string }[]}
 */
export function extractRunnerLinks(html) {
  const links = [];
  let match;

  RUNNER_LINK_RE.lastIndex = 0;

  while ((match = RUNNER_LINK_RE.exec(html))) {
    const docsPath = match[2];
    const version = match[3] ?? null;
    const url = version
      ? `https://demos.handsontable.com/?docs=${docsPath}&v=${version}`
      : `https://demos.handsontable.com/?docs=${docsPath}`;

    links.push({ docsPath, version, url });
  }

  return links;
}

/**
 * Walks every .html file under distDir and dedupes runner links by docs path,
 * recording which built pages reference each one.
 *
 * @param {string} distDir
 * @returns {Promise<Map<string, { url: string, version: string | null, pages: string[] }>>}
 */
export async function collectRunnerLinks(distDir) {
  const entries = await readdir(distDir, { recursive: true, withFileTypes: true });
  const htmlFiles = entries
    .filter(entry => entry.isFile() && extname(entry.name) === '.html')
    .map(entry => join(entry.parentPath ?? entry.path, entry.name));

  const links = new Map();

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf-8');

    for (const link of extractRunnerLinks(html)) {
      const existing = links.get(link.docsPath);

      if (existing) {
        existing.pages.push(file);
      } else {
        links.set(link.docsPath, { url: link.url, version: link.version, pages: [file] });
      }
    }
  }

  return links;
}

/**
 * Fetches the runner manifest from an http(s) URL or a local file path.
 *
 * @param {string} manifestSource
 * @returns {Promise<Map<string, object>>} docsPath -> manifest entry
 */
export async function fetchManifest(manifestSource) {
  const raw = manifestSource.startsWith('http')
    ? await (await fetch(manifestSource)).text()
    : await readFile(manifestSource, 'utf-8');
  const parsed = JSON.parse(raw);
  const examples = parsed.examples ?? parsed;

  return new Map(examples.map(entry => [entry.docsPath, entry]));
}

/**
 * Flags every extracted runner link whose docs path is absent from the
 * manifest — the deterministic, no-browser-needed catch for the silent
 * default-starter fallback (typo'd path, renamed guide, recipe path, etc.).
 *
 * @param {Map<string, { url: string, pages: string[] }>} links
 * @param {Map<string, object>} manifestByDocsPath
 * @returns {{ missing: { docsPath: string, url: string, pages: string[] }[], reverseDiffCount: number }}
 */
export function crossCheckManifest(links, manifestByDocsPath) {
  const missing = [];

  for (const [docsPath, link] of links) {
    if (!manifestByDocsPath.has(docsPath)) {
      missing.push({ docsPath, url: link.url, pages: link.pages });
    }
  }

  // Informational only: the manifest legitimately contains more files than are
  // ever linked (e.g. vanilla ships both .js and .ts, only one is the default
  // link target), so a path present only in the manifest is not a failure.
  const reverseDiffCount = [...manifestByDocsPath.keys()].filter(p => !links.has(p)).length;

  return { missing, reverseDiffCount };
}

function isIgnoredConsoleMessage(message) {
  return IGNORED_CONSOLE_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Polls every frame in the page (the flattened tree includes nested Sandpack /
 * container iframes) until a rendered Handsontable grid is found or the
 * deadline passes.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} deadline - epoch ms
 * @returns {Promise<boolean>}
 */
async function waitForGrid(page, deadline) {
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const found = await frame
        .evaluate(() => !!document.querySelector('.ht_master .htCore tbody tr td'))
        .catch(() => false); // frames can detach mid-poll while Sandpack reboots its preview

      if (found) return true;
    }

    await page.waitForTimeout(500);
  }

  return false;
}

/**
 * Confirms the page displays this example's own title, not the generic
 * fallback starter's. The runner header renders "<guideTitle> · <exampleTitle>"
 * for a manifest hit; an unknown docs path shows a generic starter name
 * instead (e.g. "React (Vite, TS)") with neither string present.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} manifestEntry
 * @returns {Promise<boolean>}
 */
async function hasExpectedContent(page, manifestEntry) {
  const text = await page.evaluate(() => document.body.innerText).catch(() => '');

  return text.includes(manifestEntry.guideTitle) && text.includes(manifestEntry.exampleTitle);
}

/**
 * Loads one runner link and verifies it renders the correct example.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {string} docsPath
 * @param {{ url: string, pages: string[] }} link
 * @param {object} manifestEntry
 * @returns {Promise<object>} failure record, or null on success
 */
async function verifyLink(browser, docsPath, link, manifestEntry) {
  const timeoutMs = TIER_TIMEOUTS_MS[manifestEntry.framework] ?? TIER_TIMEOUTS_MS.javascript;
  const page = await browser.newPage();
  const consoleWarnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error' && !isIgnoredConsoleMessage(msg.text())) consoleWarnings.push(msg.text());
  });
  page.on('pageerror', err => {
    if (!isIgnoredConsoleMessage(String(err))) consoleWarnings.push(String(err));
  });

  try {
    const deadline = Date.now() + timeoutMs;

    try {
      await page.goto(link.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    } catch {
      return { docsPath, url: link.url, framework: manifestEntry.framework, phase: 'load-timeout', reason: `page failed to load within ${timeoutMs}ms`, pages: link.pages, consoleWarnings };
    }

    const gridFound = await waitForGrid(page, deadline);

    if (!gridFound) {
      return { docsPath, url: link.url, framework: manifestEntry.framework, phase: 'no-grid', reason: `no Handsontable grid rendered within ${timeoutMs}ms`, pages: link.pages, consoleWarnings };
    }

    const contentOk = await hasExpectedContent(page, manifestEntry);

    if (!contentOk) {
      return { docsPath, url: link.url, framework: manifestEntry.framework, phase: 'wrong-content', reason: `page does not display "${manifestEntry.guideTitle}" / "${manifestEntry.exampleTitle}" — likely the default fallback starter`, pages: link.pages, consoleWarnings };
    }

    return null;
  } finally {
    await page.close();
  }
}

/**
 * Runs `worker` over `items` with at most `limit` concurrent in flight.
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const i = next++;

      results[i] = await worker(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));

  return results;
}

/**
 * Splits manifest-matched links into Tier-1 (checked exhaustively) and a
 * deterministic per-framework sample of Tier-2 (slow cloud-container boots).
 *
 * @param {{ docsPath: string, url: string, pages: string[] }[]} matched
 * @param {Map<string, object>} manifestByDocsPath
 * @param {number | 'all'} tier2Sample
 * @returns {{ toCheck: object[], droppedTier2: number }}
 */
export function planHeadlessChecks(matched, manifestByDocsPath, tier2Sample) {
  const tier1 = [];
  const tier2ByFramework = new Map();

  for (const item of matched) {
    const manifestEntry = manifestByDocsPath.get(item.docsPath);

    if (TIER1_FRAMEWORKS.has(manifestEntry.framework)) {
      tier1.push({ ...item, manifestEntry });
    } else if (TIER2_FRAMEWORKS.has(manifestEntry.framework)) {
      const bucket = tier2ByFramework.get(manifestEntry.framework) ?? [];

      bucket.push({ ...item, manifestEntry });
      tier2ByFramework.set(manifestEntry.framework, bucket);
    }
  }

  let droppedTier2 = 0;
  const tier2 = [];

  for (const bucket of tier2ByFramework.values()) {
    bucket.sort((a, b) => a.docsPath.localeCompare(b.docsPath));

    const sampled = tier2Sample === 'all' ? bucket : bucket.slice(0, tier2Sample);

    droppedTier2 += bucket.length - sampled.length;
    tier2.push(...sampled);
  }

  return { toCheck: [...tier1, ...tier2], droppedTier2 };
}

/**
 * @param {string[]} argv
 * @returns {object}
 */
export function parseArgs(argv) {
  const args = {
    dist: './dist',
    runnerOrigin: 'https://demos.handsontable.com',
    manifest: null,
    staticOnly: false,
    tier2Sample: 10,
    concurrency: 4,
    filter: null,
    json: './test-artifacts/runner-sweep-report.json',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];

    if (arg === '--dist') args.dist = next();
    else if (arg === '--runner-origin') args.runnerOrigin = next();
    else if (arg === '--manifest') args.manifest = next();
    else if (arg === '--static-only') args.staticOnly = true;
    else if (arg === '--tier2-sample') { const v = next(); args.tier2Sample = v === 'all' ? 'all' : Number(v); }
    else if (arg === '--concurrency') args.concurrency = Number(next());
    else if (arg === '--filter') args.filter = next();
    else if (arg === '--json') args.json = next();
  }

  if (!args.manifest) args.manifest = `${args.runnerOrigin}/docs-examples/manifest.json`;

  return args;
}

async function main(argv) {
  const args = parseArgs(argv);

  console.log(`Walking ${args.dist} for runner links...`);
  const allLinks = await collectRunnerLinks(args.dist);
  const links = args.filter
    ? new Map([...allLinks].filter(([docsPath]) => docsPath.includes(args.filter)))
    : allLinks;

  console.log(`Found ${links.size} distinct runner link(s)${args.filter ? ` matching "${args.filter}"` : ''} (${allLinks.size} total).`);

  console.log(`Fetching manifest from ${args.manifest}...`);
  const manifestByDocsPath = await fetchManifest(args.manifest);
  const { missing, reverseDiffCount } = crossCheckManifest(links, manifestByDocsPath);

  console.log(`Manifest cross-check: ${missing.length} missing, ${reverseDiffCount} manifest-only path(s) (expected, informational).`);

  const failures = missing.map(m => ({ ...m, phase: 'manifest', reason: 'docs path is not in the runner manifest — would silently render the default fallback starter', framework: null, consoleWarnings: [] }));

  const matched = [...links].filter(([docsPath]) => manifestByDocsPath.has(docsPath)).map(([docsPath, link]) => ({ docsPath, ...link }));
  let loaded = 0;
  let droppedTier2 = 0;

  if (!args.staticOnly) {
    const { toCheck, droppedTier2: dropped } = planHeadlessChecks(matched, manifestByDocsPath, args.tier2Sample);

    droppedTier2 = dropped;
    if (droppedTier2 > 0) console.log(`Sampling Tier-2 (vue/angular): checking ${toCheck.length}, skipping ${droppedTier2} (use --tier2-sample all to check every one).`);

    const browser = await chromium.launch({ headless: true });

    try {
      const tier1Items = toCheck.filter(item => TIER1_FRAMEWORKS.has(item.manifestEntry.framework));
      const tier2Items = toCheck.filter(item => TIER2_FRAMEWORKS.has(item.manifestEntry.framework));

      const tier1Results = await runPool(tier1Items, args.concurrency, item => verifyLink(browser, item.docsPath, item, item.manifestEntry));
      const tier2Results = await runPool(tier2Items, Math.min(2, args.concurrency), item => verifyLink(browser, item.docsPath, item, item.manifestEntry));

      loaded = tier1Items.length + tier2Items.length;
      failures.push(...[...tier1Results, ...tier2Results].filter(Boolean));
    } finally {
      await browser.close();
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    runnerOrigin: args.runnerOrigin,
    distDir: args.dist,
    totals: {
      extracted: links.size,
      manifestMissing: missing.length,
      loaded,
      passed: loaded - failures.filter(f => f.phase !== 'manifest').length,
      failed: failures.length,
      tier2Sampled: args.staticOnly ? 0 : loaded,
      tier2Dropped: droppedTier2,
    },
    failures,
  };

  await mkdir(dirname(args.json), { recursive: true });
  await writeFile(args.json, JSON.stringify(report, null, 2));

  if (failures.length > 0) {
    console.table(failures.map(f => ({ docsPath: f.docsPath, phase: f.phase, reason: f.reason })));
  }

  console.log(`Report written to ${args.json}. ${report.totals.failed} failure(s).`);

  return report;
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const report = await main(process.argv.slice(2));

  process.exitCode = report.totals.failed > 0 ? 1 : 0;
}
