import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  findingsFromScan,
  marksForScan,
  representativeScans,
  type BaselineEntry,
  type NodeBox,
  type ScanMark,
} from '../../lib/a11y-baseline.mjs';
import { WCAG_TAGS, measureNodes } from '../axe-scan';
import { DOCS_STATES, STILL_TIMEOUT, hasRequirement, openDocsPage, settle } from './docs-site';
import {
  DOCS_PAGES,
  DOCS_THEMES,
  docsBaseUrl,
  type DocsPage,
} from './pages.mjs';

/**
 * The docs site scan: every page of `pages.mjs` in the site's light and dark color schemes, through
 * `@axe-core/playwright`, against the WCAG 2.2 A and AA rule set the product scan uses. The whole
 * document is scanned: the header, the navigation, the sidebar and the table of contents, the prose
 * and its code blocks, and every example with the grid inside it, iframes included. That is the
 * support documentation the conformance report's documentation rows are about.
 *
 * Like the product scan, a test here never fails on a violation. It writes the raw axe result to
 * `test-results/a11y-docs/scans/<page>--<theme>.json` and attaches it, and the reporter
 * (`reporters/a11y.ts`, with `suite: 'docs'`) compares the run with `docs-baseline.json`. What fails a
 * test is tooling: a page that does not answer, answers with the wrong status or the deploy's password
 * wall, an example that never finished loading, a color scheme that did not apply, a state the
 * keyboard did not open. Policy: `tests/AGENTS.md`, "A11y: the docs site scan".
 *
 * What makes two runs of the same deploy agree is how `docs-site.ts` opens a page and settles it: the
 * third-party hosts blocked, the color scheme set before the first paint, the examples loaded, the
 * animations ended. The scan therefore says nothing about the blocked widgets; the PR that added the scan
 * lists them as gaps. The document inside a video or design-file embed is left out the same way
 * (`THIRD_PARTY_FRAMES`); the frame element stays in.
 */

const BASE_URL = docsBaseUrl(process.env.DOCS_A11Y_BASE_URL);
// `DOCS_A11Y_SCREENSHOTS=0` photographs nothing: the run that builds a baseline marks every finding new,
// and a screenshot per scan would make the HTML report hundreds of megabytes.
const SCREENSHOTS = process.env.DOCS_A11Y_SCREENSHOTS !== '0';
// The outline colors of the screenshot marks, as in the product scan: new, grown, a pictured known issue.
const MARK_COLORS: Record<ScanMark['status'], string> = { new: '#d03b3b', grown: '#b85a2f', known: '#1c5cab' };
// A docs page can be many screens long: a screenshot shows the marked part, at most this tall.
const MAX_CLIP_HEIGHT = 1600;
// How long a screenshot may take before the scan is kept without one.
const SCREENSHOT_TIMEOUT = 20_000;
// The embeds whose document is another service's (a video, a design file): axe reads into a frame, and what it
// finds there changes with that service, so the nodes inside such a frame are dropped and the frame itself stays
// (its title is the docs' own markup). axe's own `exclude` does not reach into a cross-origin frame here.
const THIRD_PARTY_FRAMES = ['iframe[src*="youtube.com"]', 'iframe[src*="youtube-nocookie.com"]', 'iframe[src*="figma.com"]'];

const BASELINE_ENTRIES: BaselineEntry[] = (() => {
  try {
    return JSON.parse(readFileSync(new URL('./docs-baseline.json', import.meta.url), 'utf8')).entries ?? [];
  } catch {
    return [];
  }
})();
const PICTURED = representativeScans(BASELINE_ENTRIES);

for (const theme of DOCS_THEMES) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme as 'light' | 'dark' });

    for (const entry of DOCS_PAGES) {
      test(`${entry.id} on ${theme}`, async({ page }, testInfo) => {
        await scan(page, testInfo, entry, theme);
      });
    }
  });
}

/**
 * Opens a page in a color scheme, reaches its state, scans it and writes the scan.
 *
 * @param page The page.
 * @param testInfo The test.
 * @param entry The catalog entry.
 * @param theme The color scheme.
 */
async function scan(page: Page, testInfo: TestInfo, entry: DocsPage, theme: string): Promise<void> {
  const started = Date.now();
  const pageErrors: string[] = [];
  const { url } = await openDocsPage(page, entry, { theme, baseUrl: BASE_URL, pageErrors });

  // A control only production builds render: on any other deploy the page is not scanned. The test attaches
  // no scan, so the reporter reads the page as not scanned and its baseline entries as unverified, never as
  // fixed, and the annotation says why.
  if (entry.requires && !(await hasRequirement(page, entry.requires))) {
    testInfo.annotations.push({ type: 'not-scanned', description: `${entry.id}: this build renders no ${entry.requires} (production builds only)` });

    return;
  }

  await DOCS_STATES[entry.state](page);

  if (!(await settle(page))) {
    testInfo.annotations.push({ type: 'dom-not-still', description: `the DOM kept changing for ${STILL_TIMEOUT} ms; scanned as it was` });
  }

  const results = await new AxeBuilder({ page })
    .options({ ancestry: true })
    .withTags(WCAG_TAGS)
    .analyze();
  const thirdPartyNodes = await dropThirdPartyFrames(page, results);
  const scansDir = path.join(testInfo.project.outputDir, 'scans');

  mkdirSync(scansDir, { recursive: true });
  await measureNodes(page, results.violations);

  const marks = marksForScan({
    findings: findingsFromScan({ page: entry.id, theme, violations: results.violations }),
    entries: BASELINE_ENTRIES.filter(item => item.page === entry.id && item.theme === theme),
    pictured: PICTURED.get(`${entry.id}|${theme}`),
  });
  let screenshot = SCREENSHOTS && marks.length > 0 ? `${entry.id}--${theme}.jpg` : null;
  let clip: NodeBox | null = null;

  // The screenshot only helps a reader find the marks, so it has a budget of its own: a full-page capture
  // of the longest page (the Core API reference, a minute to load and scan in CI) once ran the test out
  // of time, and the scan was lost with it. Past the budget the scan stands without a picture.
  if (screenshot) {
    clip = await outlineMarks(page, marks);
    try {
      await page.screenshot({ path: path.join(scansDir, screenshot), type: 'jpeg', quality: 60, fullPage: true, clip,
        timeout: SCREENSHOT_TIMEOUT });
    } catch (error) {
      testInfo.annotations.push({ type: 'screenshot-skipped', description: String(error).slice(0, 300) });
      screenshot = null;
      clip = null;
    }
  }

  // A page error is the docs site's own bug, not the scan's: it is recorded with the scan and annotated,
  // and the scan stands, since the examples finished loading.
  for (const error of pageErrors) {
    testInfo.annotations.push({ type: 'page-error', description: error.slice(0, 500) });
  }

  const record = {
    page: entry.id,
    theme,
    fixture: entry.path,
    url,
    state: entry.state,
    surface: entry.surface,
    axeCoreVersion: results.testEngine.version,
    timestamp: results.timestamp,
    durationMs: Date.now() - started,
    counts: {
      violations: results.violations.length,
      incomplete: results.incomplete.length,
      passes: results.passes.length,
      inapplicable: results.inapplicable.length,
    },
    violations: results.violations,
    incomplete: results.incomplete.map(result => ({ id: result.id, impact: result.impact, nodes: result.nodes.length })),
    screenshot,
    clip,
    marks: marks.map(({ selectors, ...mark }) => mark),
    pageErrors: pageErrors.map(error => error.slice(0, 500)),
    thirdPartyNodes,
  };
  const file = path.join(scansDir, `${entry.id}--${theme}.json`);

  writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
  await testInfo.attach('axe-scan', { path: file, contentType: 'application/json' });
}

/**
 * Drops the violation nodes inside a third-party embed (`THIRD_PARTY_FRAMES`), in place, and the violations
 * left with no node.
 *
 * @param page The page.
 * @param results The axe results.
 * @returns How many nodes were dropped.
 */
async function dropThirdPartyFrames(page: Page, results: { violations: Array<{ nodes: Array<{ target: unknown[] }> }> }): Promise<number> {
  const framed = [...new Set(results.violations.flatMap(violation => violation.nodes
    .filter(node => node.target.length > 1).map(node => String(node.target[0]))))];
  const thirdParty = new Set(await page.evaluate(({ list, frames }) => list
    .filter(css => frames.some(frame => document.querySelector(css)?.matches(frame))), { list: framed, frames: THIRD_PARTY_FRAMES }));
  let dropped = 0;

  results.violations = results.violations.filter((violation) => {
    const kept = violation.nodes.filter(node => !(node.target.length > 1 && thirdParty.has(String(node.target[0]))));

    dropped += violation.nodes.length - kept.length;
    violation.nodes = kept;

    return kept.length > 0;
  });

  return dropped;
}

/**
 * Outlines and numbers every node of every mark in an overlay that takes no pointer events, after
 * the scan, and returns the page area to photograph: the marked nodes with a margin, cut to
 * `MAX_CLIP_HEIGHT` from the first one down, since a docs page can be many screens long.
 *
 * @param page The page.
 * @param marks The marks.
 * @returns The clip, in page coordinates.
 */
async function outlineMarks(page: Page, marks: ScanMark[]): Promise<NodeBox> {
  return page.evaluate(([list, colors, maxHeight]) => {
    const layer = document.createElement('div');
    const areas: Array<{ left: number; top: number; right: number; bottom: number }> = [];

    layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:absolute;inset:0 auto auto 0;width:0;height:0;z-index:2147483647;pointer-events:none';
    for (const mark of list) {
      for (const selector of mark.selectors) {
        const css = selector.at(-1);
        const node = typeof css === 'string' ? document.querySelector(css) : null;
        const rect = node?.getBoundingClientRect();

        if (!rect) {
          continue;
        }

        const left = rect.left + window.scrollX;
        const top = rect.top + window.scrollY;
        const box = document.createElement('div');
        const label = document.createElement('span');
        const color = colors[mark.status];

        box.style.cssText = `position:absolute;left:${left - 2}px;top:${top - 2}px;width:${Math.max(rect.width, 8) + 4}px;`
          + `height:${Math.max(rect.height, 8) + 4}px;outline:3px solid ${color};box-sizing:border-box`;
        label.textContent = String(mark.n);
        label.style.cssText = 'position:absolute;left:-3px;top:-22px;min-width:18px;padding:1px 5px;border-radius:9px;'
          + `background:${color};color:#fff;font:700 12px/18px system-ui,sans-serif;text-align:center`;
        box.append(label);
        layer.append(box);
        areas.push({ left, top: top - 24, right: left + Math.max(rect.width, 8), bottom: top + Math.max(rect.height, 8) });
      }
    }
    document.body.append(layer);

    const width = document.documentElement.scrollWidth;
    const height = document.documentElement.scrollHeight;

    if (areas.length === 0) {
      return { x: 0, y: 0, width, height: Math.min(height, maxHeight) };
    }

    const margin = 24;
    const top = Math.max(0, Math.min(...areas.map(area => area.top)) - margin);
    const bottom = Math.min(height, top + maxHeight, Math.max(...areas.map(area => area.bottom)) + margin);

    return { x: 0, y: Math.round(top), width, height: Math.max(1, Math.round(bottom - top)) };
  }, [marks, MARK_COLORS, MAX_CLIP_HEIGHT] as const);
}
