// Verifies every "Open in runner" link (demos.handsontable.com/?docs=...) that
// framework-loader.mjs emits into the built docs HTML.
//
// Two phases:
// 1. Static: walk the built dist/ HTML, extract every runner href, and cross-check
//    each docs path against the runner's manifest.json. A path missing from the
//    manifest is a guaranteed failure — the runner has no such example and renders
//    an "Example not found" page, so this is the fast, deterministic way to catch a
//    dead runner link.
// 2. Headless (skipped with --static-only): load each link in Chromium and confirm a
//    Handsontable grid actually rendered, then assert the page displays the example's
//    own guideTitle + exampleTitle from the manifest — a guard against the runner
//    loading a different example than the link intended.
//
// Run this AFTER building the docs: it scans the built HTML under --dist (default
// ./dist) and fails loudly if that directory is absent. The build stamps the
// Handsontable version into every runner link, and the sweep auto-detects that
// version to pick the matching manifest bucket — so no --version flag is needed for
// a normal run.
//
// Usage: node scripts/test-runner-links.mjs [options] — see --help for the full option list.

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

// The build pipeline's HTML serializer re-escapes "&" inconsistently depending
// on where the markup passes through it — plain "&", the named entity
// "&amp;", and the numeric entity "&#x26;" have all been observed in built
// output — so every form must be accepted here.
const RUNNER_LINK_RE = /href="(https:\/\/demos\.handsontable\.com\/\?docs=([^"&]+))(?:&(?:amp;|#x26;)?v=([^"&]+))?"/gi;

/**
 * Formats a Date as `YYYYMMDD-HHmmss` for use in a report filename, so
 * repeated runs don't clobber each other's report.
 *
 * @param {Date} date
 * @returns {string}
 */
export function formatTimestamp(date) {
  const pad = n => String(n).padStart(2, '0');

  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

const HELP_TEXT = `Usage: node scripts/test-runner-links.mjs [options]

  Run after building the docs — the sweep scans the built HTML under --dist.

  --dist <dir>              built-HTML dir to scan (default: ./dist)
  --runner-origin <url>     runner origin (default: https://demos.handsontable.com)
  --version <ver>           OVERRIDE the manifest bucket. Normally unneeded: the sweep
                             auto-detects the version the docs were built with from the
                             runner links themselves. Pass this only to force a bucket
                             ("next", or "X.Y"/"X.Y.Z" -> "X.Y"), e.g. when the links
                             carry no version. Does NOT affect the docs build.
  --static-only             skip ALL headless rendering (Tier-1 and Tier-2) — do only link
                             extraction + manifest cross-check. Never launches a browser, so
                             it runs even without Playwright's Chromium installed.
  --tier1-sample <N|all>    how many JS/TS/React links to headless-check per framework;
                             0 skips Tier-1 entirely (default: all)
  --tier2-sample <N|all>    how many Vue/Angular links to headless-check per framework;
                             0 skips Tier-2 entirely (default: 10)
  --tier1-offset <N>        skip the first N JS/TS/React links per framework before
                             sampling (default: 0)
  --tier2-offset <N>        skip the first N Vue/Angular links per framework before
                             sampling -- resume past links already checked, e.g.
                             --tier2-offset 15 --tier2-sample 35 checks the 16th-50th
                             per framework (default: 0)
  --tier1-concurrency <N>   parallel Tier-1 pages (default: 4)
  --tier2-concurrency <N>   parallel Tier-2 pages. Kept at 1 by default: a Vue/Angular cloud
                             dev-server container needs ~1 min to cold-boot, booting several
                             at once can starve each past the timeout, and prod caps
                             concurrent containers at 5 (default: 1)
  --tier1-retries <N>       retry a transient Tier-1 failure (no-grid/load-timeout) up to
                             N times (default: 0 — Tier-1 sandboxes are cheap and reliable)
  --tier2-retries <N>       retry a transient Tier-2 failure up to N times (default: 1 —
                             a cloud container sometimes fails to provision under load)
  --filter <substring>      only check docs paths containing this substring
  --json <path>             report output path (default: ./tests/test-artifacts/runner-links/runner-sweep-report-<timestamp>.json)
  --help                    print this message and exit`;

const TIER1_FRAMEWORKS = new Set(['javascript', 'typescript', 'react']);
const TIER2_FRAMEWORKS = new Set(['vue', 'angular']);
// Vue/Angular boot a full cloud dev-server (Vite) container; under concurrent load the
// cold boot routinely runs past two minutes, so the caps are generous — a shorter cap
// reports a slow-but-working example as a false "no-grid" failure.
const TIER_TIMEOUTS_MS = { javascript: 60_000, typescript: 60_000, react: 60_000, vue: 240_000, angular: 240_000 };

// A tier-2 cloud container sometimes fails to provision under load — a transient
// no-grid/load-timeout rather than a broken example (the same link boots fine when
// run alone). Only these phases are retried; a `setup-failed` (build/transpile error)
// is deterministic and never retried. How many times each tier retries is set per run
// via --tier1-retries / --tier2-retries (tier-1 defaults to 0 — its sandboxes are cheap
// and reliable and it has hundreds of links; tier-2 defaults to 1).
const RETRYABLE_PHASES = new Set(['no-grid', 'load-timeout']);

// Some examples build their grid only after a user action (drop a file, click a
// button), so no `.ht_master .htCore` exists at load and the plain grid check
// reports a false no-grid. For these, the sweep instead asserts the example
// rendered its own pre-interaction UI (a "ready marker"), which confirms it
// loaded and is not the blank/failed sandbox. Keyed by docsPath substring.
const INTERACTIVE_EXAMPLES = [
  { match: 'import-export/import-csv-excel', marker: /Load sample data|No data loaded yet/i },
];

/**
 * Returns the ready-marker regex for an interactive example, or null if the
 * example is expected to render a grid on its own.
 *
 * @param {string} docsPath
 * @returns {RegExp | null}
 */
export function interactiveMarkerFor(docsPath) {
  return INTERACTIVE_EXAMPLES.find(entry => docsPath.includes(entry.match))?.marker ?? null;
}

// Benign console noise the runner/sandbox emit even on a healthy example: network churn
// while Sandpack reboots its preview, and Vite HMR websocket chatter from the tier-2
// dev-server containers. These are matched against the message's FIRST LINE only (see
// isIgnoredConsoleMessage) so a genuine SyntaxError/TypeError — whose multi-line stack
// happens to contain a codesandbox.io URL — is still captured rather than swallowed.
const IGNORED_CONSOLE_PATTERNS = [
  /net::ERR_/i,
  /Failed to load resource/i,
  /Failed to fetch/i,
  /AbortError/i,
  /NetworkError/i,
  /Outdated Optimize Dep/i,
  /csb\.app/i,
  /codesandbox\.io/i,
  /WebSocket connection to/i,
  /\[vite\]/i,
  /@vite\/client/i,
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
 * Resolves a Handsontable version string to the docs-examples bucket that
 * hosts its manifest — mirrors `deriveDocsBucketCandidate` in the runner repo
 * (handsontable/examples, runner/packages/runtime/src/docs-bucket.ts):
 * the in-progress build uses the "next" bucket, every release uses "X.Y"
 * (patch is dropped — the runner buckets examples per minor version).
 *
 * Local/staging docs builds stamp `CURRENT_DOCS_VERSION` (see
 * docs/src/plugins/docs-version.mjs) as `0.0.0-next-{sha}-{date}`, not the
 * literal string "next" — that pre-release form is also mapped to "next"
 * here so a version straight out of a runner link resolves correctly.
 *
 * @param {string} version
 * @returns {string}
 */
export function deriveManifestBucket(version) {
  if (version === 'next' || /^0\.0\.0-next-/.test(version)) return 'next';

  const match = String(version).match(/^(\d+)\.(\d+)/);

  return match ? `${match[1]}.${match[2]}` : version;
}

/**
 * Resolves which manifest to cross-check against. The version is taken from,
 * in priority order: an explicit --version override, the version the docs build
 * stamped into the runner links (framework-loader emits `v=<CURRENT_DOCS_VERSION>`
 * on every link — see docs/src/plugins/framework-loader.mjs), or the literal
 * "next" when links carry no version at all. The manifest URL is always derived
 * from the runner origin and the version's bucket — there is no separate manifest
 * flag to keep in sync.
 *
 * @param {{ explicitVersion: string | null, runnerOrigin: string, links: Map<string, { version: string | null }> }} params
 * @returns {{ version: string, bucket: string, source: string, url: string }}
 */
export function resolveManifestSource({ explicitVersion, runnerOrigin, links }) {
  const versionFromLinks = [...links.values()].find(link => link.version)?.version ?? null;
  const version = explicitVersion ?? versionFromLinks ?? 'next';
  const source = explicitVersion
    ? 'from --version override'
    : versionFromLinks
      ? 'auto-detected from links'
      : 'default "next" (links carry no version)';
  const bucket = deriveManifestBucket(version);

  return { version, bucket, source, url: `${runnerOrigin}/docs-examples/${bucket}/manifest.json` };
}

/**
 * Fetches the runner manifest from an http(s) URL or a local file path.
 *
 * @param {string} manifestSource
 * @returns {Promise<Map<string, object>>} docsPath -> manifest entry
 */
export async function fetchManifest(manifestSource) {
  let raw;

  if (manifestSource.startsWith('http')) {
    const res = await fetch(manifestSource);

    if (!res.ok) throw new Error(`Failed to fetch manifest from ${manifestSource}: HTTP ${res.status}`);
    raw = await res.text();
  } else {
    raw = await readFile(manifestSource, 'utf-8');
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Manifest at ${manifestSource} is not valid JSON — check the version/bucket is correct.`);
  }

  const examples = parsed.examples ?? parsed;

  return new Map(examples.map(entry => [entry.docsPath, entry]));
}

/**
 * Flags every extracted runner link whose docs path is absent from the
 * manifest — the deterministic, no-browser-needed catch for a dead runner link
 * (typo'd path, renamed guide, recipe path, etc.); the runner renders an
 * "Example not found" page for an unknown docs path.
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

/**
 * Reports whether a console/page-error message is benign infrastructure noise.
 *
 * Only the FIRST LINE is matched: a real error (e.g. `SyntaxError: Unexpected
 * token`) carries a multi-line stack whose frames point at codesandbox.io, and
 * matching the whole string against the `/codesandbox\.io/i` pattern would
 * silently swallow the very failures this sweep exists to catch. The first line
 * of a genuine error is the error itself; the first line of infra noise is the
 * noise ("Failed to load resource ...", "[vite] ...").
 *
 * @param {string} message
 * @returns {boolean}
 */
export function isIgnoredConsoleMessage(message) {
  const firstLine = String(message).split('\n', 1)[0];

  return IGNORED_CONSOLE_PATTERNS.some(pattern => pattern.test(firstLine));
}

/**
 * Reports whether page text shows the runner's terminal "Setup failed" banner.
 * The sandbox renders it when the example fails to build/transpile (for
 * example, syntax its compiler can't parse). It never recovers, so the sweep
 * stops waiting and reports it immediately instead of burning the full timeout.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function matchesSetupFailure(text) {
  return /setup failed/i.test(text);
}

/**
 * Polls every frame in the page (the flattened tree includes nested Sandpack /
 * container iframes) until a rendered Handsontable grid is found, the
 * deadline passes, or `shouldAbort` reports a fatal condition (e.g. a 404 on
 * a runner-origin resource) that makes waiting out the full timeout pointless.
 *
 * The presence signal is the rendered master table (`.ht_master .htCore`), NOT a
 * data cell: an intentionally empty example (empty-data-state, a "load data on
 * click" demo, `data={[]}`) renders a valid grid with headers but zero `<td>`
 * cells, and keying on a `<td>` reports those working examples as false "no-grid"
 * failures. The runner renders no `.htCore` at all on its "Example not found" page,
 * so table presence alone remains a reliable real-grid signal.
 *
 * Returns a status: 'grid' (rendered), 'interactive-ready' (no grid yet, but the
 * example rendered its `readyMarker` pre-interaction UI), 'setup-failed' (runner
 * build/transpile failure — terminal), 'aborted' (shouldAbort fired, e.g. a
 * runner-origin 404), or 'timeout' (deadline reached with none of the above).
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} deadline - epoch ms
 * @param {() => boolean} [shouldAbort]
 * @param {RegExp | null} [readyMarker] - for interactive examples, page text that counts as loaded
 * @returns {Promise<'grid'|'interactive-ready'|'setup-failed'|'aborted'|'timeout'>}
 */
async function waitForGrid(page, deadline, shouldAbort, readyMarker = null) {
  while (Date.now() < deadline) {
    if (shouldAbort?.()) return 'aborted';

    // Check the terminal "Setup failed" banner BEFORE the per-frame grid/marker
    // scan. A build/transpile failure is terminal, so an interactive example's
    // ready marker must never mask it: mid-boot the marker can appear in the
    // Sandpack preview frame while the runner also puts up the banner, and a
    // marker-first order would report that broken example as interactive-ready.
    // A rendered grid and the banner cannot coexist, so checking the banner
    // first never suppresses a real grid.
    const topText = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '');

    if (matchesSetupFailure(topText)) return 'setup-failed';

    for (const frame of page.frames()) {
      const found = await frame
        .evaluate(() => !!document.querySelector('.ht_master .htCore'))
        .catch(() => false); // frames can detach mid-poll while Sandpack reboots its preview

      if (found) return 'grid';

      // A rendered grid always wins; for an interactive example that has none
      // yet, its own pre-interaction UI (the ready marker) counts as loaded.
      if (readyMarker) {
        const frameText = await frame.evaluate(() => document.body?.innerText ?? '').catch(() => '');

        if (readyMarker.test(frameText)) return 'interactive-ready';
      }
    }

    await page.waitForTimeout(500);
  }

  return 'timeout';
}

/**
 * Tests whether page text contains both of an example's manifest titles.
 *
 * The comparison is case-insensitive: the runner header title-cases the guide
 * segment ("Cell Functions"), while the manifest stores it in sentence case
 * ("Cell functions"), and a case-sensitive check reported that mismatch as a
 * false "wrong-content" failure.
 *
 * @param {string} text
 * @param {object} manifestEntry
 * @returns {boolean}
 */
export function matchesExpectedContent(text, manifestEntry) {
  const haystack = text.toLowerCase();

  return haystack.includes(String(manifestEntry.guideTitle).toLowerCase())
    && haystack.includes(String(manifestEntry.exampleTitle).toLowerCase());
}

/**
 * Confirms the runner header displays this example's own "<guideTitle> ·
 * <exampleTitle>", guarding against the runner loading a different example than
 * the link intended.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} manifestEntry
 * @returns {Promise<boolean>}
 */
async function hasExpectedContent(page, manifestEntry) {
  const text = await page.evaluate(() => document.body.innerText).catch(() => '');

  return matchesExpectedContent(text, manifestEntry);
}

/**
 * Loads one runner link and verifies it renders the correct example. Logs a
 * start line before navigating and a finish line with elapsed time — the
 * headless phase can otherwise look hung for minutes (Angular's cold boot
 * alone can take ~100s) with nothing printed until every check completes.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {string} docsPath
 * @param {{ url: string, pages: string[] }} link
 * @param {object} manifestEntry
 * @param {{ label: string, index: number, total: number }} progress
 * @returns {Promise<object>} failure record, or null on success
 */
async function verifyLink(browser, docsPath, link, manifestEntry, progress) {
  const timeoutMs = TIER_TIMEOUTS_MS[manifestEntry.framework] ?? TIER_TIMEOUTS_MS.javascript;
  const prefix = `[${progress.label} ${progress.index}/${progress.total}]`;
  const startedAt = Date.now();

  console.log(`${prefix} loading ${docsPath} (${manifestEntry.framework}, timeout ${Math.round(timeoutMs / 1000)}s)...`);

  const page = await browser.newPage();
  const consoleWarnings = [];
  const notFoundUrls = [];
  const runnerOrigin = new URL(link.url).origin;

  page.on('console', msg => {
    if (msg.type() === 'error' && !isIgnoredConsoleMessage(msg.text())) consoleWarnings.push(msg.text());
  });
  page.on('pageerror', err => {
    if (!isIgnoredConsoleMessage(String(err))) consoleWarnings.push(String(err));
  });
  // A 404 on a runner-origin resource (manifest, example JSON, bundle) means
  // the example can never render — abort the grid wait early instead of
  // burning the full per-framework timeout. Third-party hosts (Sandpack CDN,
  // fonts) are excluded: their transient 404s don't imply a broken example.
  page.on('response', res => {
    if (res.status() === 404 && res.url().startsWith(runnerOrigin)) notFoundUrls.push(res.url());
  });

  const elapsed = () => `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
  const finish = result => {
    console.log(`${prefix} ${result ? `FAILED (${result.phase})` : 'passed'} — ${docsPath} (${elapsed()})`);

    return result;
  };

  try {
    const deadline = Date.now() + timeoutMs;

    let mainResponse;

    try {
      mainResponse = await page.goto(link.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    } catch {
      return finish({ docsPath, url: link.url, framework: manifestEntry.framework, phase: 'load-timeout', reason: `page failed to load within ${timeoutMs}ms`, pages: link.pages, consoleWarnings });
    }

    if (mainResponse && mainResponse.status() >= 400) {
      return finish({ docsPath, url: link.url, framework: manifestEntry.framework, phase: 'http-error', reason: `runner page responded with HTTP ${mainResponse.status()}`, pages: link.pages, consoleWarnings });
    }

    const gridState = await waitForGrid(page, deadline, () => notFoundUrls.length > 0, interactiveMarkerFor(docsPath));

    if (gridState !== 'grid' && gridState !== 'interactive-ready') {
      // The runner's "Setup failed" banner is a terminal build/transpile error —
      // report it precisely (and fast; the wait ended as soon as it appeared).
      if (gridState === 'setup-failed') {
        return finish({ docsPath, url: link.url, framework: manifestEntry.framework, phase: 'setup-failed', reason: 'runner reported "Setup failed" — the example sandbox failed to build (often unsupported JS syntax)', pages: link.pages, consoleWarnings });
      }

      // A runner-origin 404 is the more precise diagnosis than "no grid" —
      // and it's what aborted the wait early in the first place.
      if (notFoundUrls.length > 0) {
        return finish({ docsPath, url: link.url, framework: manifestEntry.framework, phase: 'http-404', reason: `runner resource(s) returned 404: ${notFoundUrls.slice(0, 3).join(', ')}`, pages: link.pages, consoleWarnings });
      }

      return finish({ docsPath, url: link.url, framework: manifestEntry.framework, phase: 'no-grid', reason: `no Handsontable grid rendered within ${timeoutMs}ms`, pages: link.pages, consoleWarnings });
    }

    const contentOk = await hasExpectedContent(page, manifestEntry);

    if (!contentOk) {
      return finish({ docsPath, url: link.url, framework: manifestEntry.framework, phase: 'wrong-content', reason: `page does not display "${manifestEntry.guideTitle}" / "${manifestEntry.exampleTitle}" — the runner rendered a different example than the link intended`, pages: link.pages, consoleWarnings });
    }

    return finish(null);
  } finally {
    // Navigate away so the old document fires pagehide, which makes the runner
    // tear down its Tier-2 container session (a keepalive DELETE /api/session/:id);
    // page.close() alone does not reliably fire pagehide. Then, for tier-2 only,
    // settle briefly BEFORE closing the page: closing it immediately drops the
    // still-in-flight keepalive DELETE, so the session leaks and squats one of the
    // 5 prod container slots until its idle timeout (verified against the live
    // runner — an immediate close leaves the session alive 15s+, a ~1s settle
    // tears it down, HTTP 410). Tier-1 uses Sandpack and has no such container
    // session, so it needs no settle (avoids adding a second to every tier-1 page).
    await page.goto('about:blank', { timeout: 5000 }).catch(() => {});
    if (TIER2_FRAMEWORKS.has(manifestEntry.framework)) await page.waitForTimeout(1000);
    await page.close();
  }
}

/**
 * Runs `worker` over `items` with at most `limit` concurrent in flight.
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
async function runPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const i = next++;

      results[i] = await worker(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));

  return results;
}

/**
 * Deterministically samples per-framework buckets down to `sample` links each,
 * after skipping the first `offset` per framework. `'all'` keeps every link
 * (from `offset` on); `0` drops every link (skips the whole group); a positive N
 * keeps N per framework after a stable docsPath sort. `offset` lets a run resume
 * past links already checked in a previous run (e.g. `--tier2-offset 15
 * --tier2-sample 35` checks the 16th-50th per framework). Anything not kept --
 * both the offset-skipped prefix and links beyond the sample -- counts as
 * dropped.
 *
 * @param {Map<string, object[]>} byFramework
 * @param {number | 'all'} sample
 * @param {number} [offset]
 * @returns {{ kept: object[], dropped: number }}
 */
function sampleByFramework(byFramework, sample, offset = 0) {
  let dropped = 0;
  const kept = [];

  for (const bucket of byFramework.values()) {
    bucket.sort((a, b) => a.docsPath.localeCompare(b.docsPath));

    const afterOffset = bucket.slice(offset);
    const sampled = sample === 'all' ? afterOffset : afterOffset.slice(0, sample);

    dropped += bucket.length - sampled.length;
    kept.push(...sampled);
  }

  return { kept, dropped };
}

/**
 * Splits manifest-matched links into a deterministic per-framework sample of
 * Tier-1 (fast JS/TS/React sandboxes) and Tier-2 (slow Vue/Angular cloud-container
 * boots). Each tier samples independently: `'all'` checks every link, `0` skips the
 * tier entirely, and a positive N keeps the first N links per framework.
 *
 * @param {{ docsPath: string, url: string, pages: string[] }[]} matched
 * @param {Map<string, object>} manifestByDocsPath
 * @param {number | 'all'} tier1Sample
 * @param {number | 'all'} tier2Sample
 * @param {number} [tier1Offset] - skip this many per framework before sampling Tier-1
 * @param {number} [tier2Offset] - skip this many per framework before sampling Tier-2
 * @returns {{ toCheck: object[], droppedTier1: number, droppedTier2: number }}
 */
export function planHeadlessChecks(matched, manifestByDocsPath, tier1Sample, tier2Sample, tier1Offset = 0, tier2Offset = 0) {
  const tier1ByFramework = new Map();
  const tier2ByFramework = new Map();

  for (const item of matched) {
    const manifestEntry = manifestByDocsPath.get(item.docsPath);
    const target = TIER1_FRAMEWORKS.has(manifestEntry.framework) ? tier1ByFramework
      : TIER2_FRAMEWORKS.has(manifestEntry.framework) ? tier2ByFramework
        : null;

    if (!target) continue;

    const bucket = target.get(manifestEntry.framework) ?? [];

    bucket.push({ ...item, manifestEntry });
    target.set(manifestEntry.framework, bucket);
  }

  const tier1 = sampleByFramework(tier1ByFramework, tier1Sample, tier1Offset);
  const tier2 = sampleByFramework(tier2ByFramework, tier2Sample, tier2Offset);

  return { toCheck: [...tier1.kept, ...tier2.kept], droppedTier1: tier1.dropped, droppedTier2: tier2.dropped };
}

/**
 * @param {string[]} argv
 * @returns {object}
 */
export function parseArgs(argv) {
  const args = {
    dist: './dist',
    runnerOrigin: 'https://demos.handsontable.com',
    // null = no override; the manifest bucket is auto-detected from the links
    // (resolveManifestSource). An explicit --version forces the bucket instead.
    version: null,
    staticOnly: false,
    tier1Sample: 'all',
    tier2Sample: 10,
    tier1Offset: 0,
    tier2Offset: 0,
    tier1Concurrency: 4,
    tier2Concurrency: 1,
    tier1Retries: 0,
    tier2Retries: 1,
    filter: null,
    json: `./tests/test-artifacts/runner-links/runner-sweep-report-${formatTimestamp(new Date())}.json`,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];

    if (arg === '--dist') args.dist = next();
    else if (arg === '--runner-origin') args.runnerOrigin = next();
    else if (arg === '--version') args.version = next();
    else if (arg === '--static-only') args.staticOnly = true;
    else if (arg === '--tier1-sample') { const v = next(); args.tier1Sample = v === 'all' ? 'all' : Number(v); }
    else if (arg === '--tier2-sample') { const v = next(); args.tier2Sample = v === 'all' ? 'all' : Number(v); }
    else if (arg === '--tier1-offset') args.tier1Offset = Number(next());
    else if (arg === '--tier2-offset') args.tier2Offset = Number(next());
    else if (arg === '--tier1-concurrency') args.tier1Concurrency = Number(next());
    else if (arg === '--tier2-concurrency') args.tier2Concurrency = Number(next());
    else if (arg === '--tier1-retries') args.tier1Retries = Number(next());
    else if (arg === '--tier2-retries') args.tier2Retries = Number(next());
    else if (arg === '--filter') args.filter = next();
    else if (arg === '--json') args.json = next();
    else if (arg === '--help' || arg === '-h') args.help = true;
  }

  return args;
}

/**
 * Runs verifyLink, retrying up to `retries` times while the result is a
 * retryable transient (a no-grid/load-timeout — e.g. a cloud container that
 * failed to provision under load). Used by both tiers; `retries` is 0 for
 * tier-1 by default (single attempt) and 1 for tier-2. verifyLink logs its own
 * start/finish line per attempt, so a retry is visible in the output as a
 * repeated load of the same docs path.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {{ docsPath: string, manifestEntry: object }} item
 * @param {{ label: string, index: number, total: number }} progress
 * @param {number} retries
 * @returns {Promise<object|null>} failure record, or null on success
 */
async function verifyWithRetry(browser, item, progress, retries) {
  let result = await verifyLink(browser, item.docsPath, item, item.manifestEntry, progress);

  for (let attempt = 1; attempt <= retries && result && RETRYABLE_PHASES.has(result.phase); attempt++) {
    console.log(`[${progress.label} ${progress.index}/${progress.total}] retrying ${item.docsPath} after ${result.phase} (attempt ${attempt + 1})...`);
    result = await verifyLink(browser, item.docsPath, item, item.manifestEntry, progress);
  }

  return result;
}

async function main(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    console.log(HELP_TEXT);

    return null;
  }

  console.log(
    `Settings: dist=${args.dist} static-only=${args.staticOnly} tier1-sample=${args.tier1Sample} tier2-sample=${args.tier2Sample} tier1-offset=${args.tier1Offset} tier2-offset=${args.tier2Offset} tier1-concurrency=${args.tier1Concurrency} tier2-concurrency=${args.tier2Concurrency} tier1-retries=${args.tier1Retries} tier2-retries=${args.tier2Retries}${args.filter ? ` filter="${args.filter}"` : ''} (run with --help to see all options)`
  );

  console.log(`Walking ${args.dist} for runner links...`);
  const allLinks = await collectRunnerLinks(args.dist);
  const links = args.filter
    ? new Map([...allLinks].filter(([docsPath]) => docsPath.includes(args.filter)))
    : allLinks;

  console.log(`Found ${links.size} distinct runner link(s)${args.filter ? ` matching "${args.filter}"` : ''} (${allLinks.size} total).`);

  // Detect the version from the links the build stamped, so the manifest bucket
  // matches the dist under test without a hand-passed --version.
  const manifest = resolveManifestSource({ explicitVersion: args.version, runnerOrigin: args.runnerOrigin, links: allLinks });

  console.log(`Version: ${manifest.version} (${manifest.source}) -> bucket ${manifest.bucket}`);
  console.log(`Fetching manifest from ${manifest.url}...`);
  const manifestByDocsPath = await fetchManifest(manifest.url);
  const { missing, reverseDiffCount } = crossCheckManifest(links, manifestByDocsPath);

  console.log(`Manifest cross-check: ${missing.length} missing, ${reverseDiffCount} manifest-only path(s) (expected, informational).`);

  const failures = missing.map(m => ({ ...m, phase: 'manifest', reason: 'docs path is not in the runner manifest — the runner renders an "Example not found" page (dead link)', framework: null, consoleWarnings: [] }));

  const matched = [...links].filter(([docsPath]) => manifestByDocsPath.has(docsPath)).map(([docsPath, link]) => ({ docsPath, ...link }));
  let loaded = 0;
  let droppedTier1 = 0;
  let droppedTier2 = 0;

  if (!args.staticOnly) {
    const plan = planHeadlessChecks(matched, manifestByDocsPath, args.tier1Sample, args.tier2Sample, args.tier1Offset, args.tier2Offset);
    const { toCheck } = plan;

    droppedTier1 = plan.droppedTier1;
    droppedTier2 = plan.droppedTier2;
    if (droppedTier1 > 0) console.log(`Sampling Tier-1 (js/ts/react): skipping ${droppedTier1} (use --tier1-sample all to check every one).`);
    if (droppedTier2 > 0) console.log(`Sampling Tier-2 (vue/angular): skipping ${droppedTier2} (use --tier2-sample all to check every one).`);

    const browser = await chromium.launch({ headless: true });

    try {
      const tier1Items = toCheck.filter(item => TIER1_FRAMEWORKS.has(item.manifestEntry.framework));
      const tier2Items = toCheck.filter(item => TIER2_FRAMEWORKS.has(item.manifestEntry.framework));
      // Tier-2 runs only after tier-1 finishes, not overlapped with it, and
      // serially by default (--tier2-concurrency 1). A Vue/Angular cloud
      // dev-server container needs ~1 min to boot; running several at once, or
      // alongside the tier-1 page pool, can starve those boots past the timeout
      // and produce false no-grid failures, and prod caps concurrent containers
      // at 5.
      const tier2Concurrency = args.tier2Concurrency;

      console.log(`Checking ${tier1Items.length} Tier-1 link(s) (concurrency ${args.tier1Concurrency}, retry ${args.tier1Retries}x), then ${tier2Items.length} Tier-2 link(s) (concurrency ${tier2Concurrency}, isolated, retry ${args.tier2Retries}x)...`);

      const tier1Results = await runPool(tier1Items, args.tier1Concurrency, (item, i) => verifyWithRetry(browser, item, { label: 'tier1', index: i + 1, total: tier1Items.length }, args.tier1Retries));
      const tier2Results = await runPool(tier2Items, tier2Concurrency, (item, i) => verifyWithRetry(browser, item, { label: 'tier2', index: i + 1, total: tier2Items.length }, args.tier2Retries));

      loaded = tier1Items.length + tier2Items.length;
      failures.push(...[...tier1Results, ...tier2Results].filter(Boolean));
    } finally {
      await browser.close();
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    runnerOrigin: args.runnerOrigin,
    version: manifest.version,
    manifestUrl: manifest.url,
    distDir: args.dist,
    totals: {
      extracted: links.size,
      manifestMissing: missing.length,
      loaded,
      passed: loaded - failures.filter(f => f.phase !== 'manifest').length,
      failed: failures.length,
      tier1Dropped: droppedTier1,
      tier2Dropped: droppedTier2,
    },
    failures,
  };

  await mkdir(dirname(args.json), { recursive: true });
  await writeFile(args.json, JSON.stringify(report, null, 2));

  if (failures.length > 0) {
    // `url` is the runner sandbox link — printed so a failure can be opened and
    // eyeballed straight from the table without cross-referencing the JSON report.
    console.table(failures.map(f => ({ docsPath: f.docsPath, phase: f.phase, url: f.url, reason: f.reason })));
  }

  // A pass/fail tally so a run's outcome is legible without scrolling the log or
  // opening the JSON report — the failure table only ever shows the failures.
  const headlessFailed = failures.filter(f => f.phase !== 'manifest').length;

  console.log('Summary:');
  console.log(`  Runner links found:   ${report.totals.extracted}`);
  console.log(`  Manifest cross-check: ${report.totals.extracted - report.totals.manifestMissing} present, ${report.totals.manifestMissing} missing`);
  const skipped = [droppedTier1 ? `${droppedTier1} tier-1` : null, droppedTier2 ? `${droppedTier2} tier-2` : null].filter(Boolean).join(', ');

  console.log(`  Headless render:      ${report.totals.passed} passed, ${headlessFailed} failed (of ${loaded} checked)${skipped ? `, ${skipped} skipped` : ''}`);
  console.log(`  Total failures:       ${report.totals.failed}`);

  console.log(`Report written to ${args.json}. ${report.totals.failed} failure(s).`);

  return report;
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const report = await main(process.argv.slice(2));

  process.exitCode = report ? (report.totals.failed > 0 ? 1 : 0) : 0;
}
