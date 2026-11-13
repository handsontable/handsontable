import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { findingsFromScan, marksForScan, representativeScans, type BaselineEntry, type ScanMark } from '../../lib/a11y-baseline.mjs';
import { WCAG_TAGS, measureNodes } from '../axe-scan';
import { WEBSITE_PAGES, WEBSITE_THEMES, sitemapCoverage, websiteBaseUrl } from './pages.mjs';
import { WEBSITE_STATES, openWebsitePage, settleWebsite, type WebsiteState } from './website-site';

/**
 * The website scan: every page of `pages.mjs` on production handsontable.com, at the phone and the desktop width,
 * through `@axe-core/playwright`, against the WCAG 2.2 A and AA rule set the product scan uses, compared by
 * `reporters/a11y.ts` (with `suite: 'website'`) with `website-baseline.json`. Policy: `tests/AGENTS.md`, "A11y: the
 * website scan".
 *
 * Like the other scans, a test never fails on a violation; it fails on tooling: a page that does not answer, answers
 * with the wrong status or a bot challenge, never hydrates, or a state the keyboard did not reach. Reduced motion is
 * on, as in the website's own scan, so a colour is never read half-faded, and axe's "needs review" on a scrollable
 * region that holds focusable content is read as a violation, as the website's own scan reads it, so a finding here and
 * there lines up. A state that submits a form or books the support call answers the write on the page
 * (`website-site.ts`, `guardSite()`): the test asserts that its write was caught and that nothing else was written.
 */

const BASE_URL = websiteBaseUrl(process.env.WEBSITE_A11Y_BASE_URL);
// `WEBSITE_A11Y_SCREENSHOTS=0` photographs nothing, for the run that seeds or refreshes the baseline.
const SCREENSHOTS = process.env.WEBSITE_A11Y_SCREENSHOTS !== '0';
const MARK_COLORS: Record<ScanMark['status'], string> = { new: '#d03b3b', grown: '#b85a2f', known: '#1c5cab' };
const MAX_CLIP_HEIGHT = 1600;
const TIMEOUT = 150_000;
const SCREENSHOT_TIMEOUT = 20_000;

const BASELINE_ENTRIES: BaselineEntry[] = (() => {
  try {
    return JSON.parse(readFileSync(new URL('./website-baseline.json', import.meta.url), 'utf8')).entries ?? [];
  } catch {
    return [];
  }
})();
const PICTURED = representativeScans(BASELINE_ENTRIES);

test('the page list covers every address production\'s sitemap lists', async({ request }) => {
  const response = await request.get(`${BASE_URL}/sitemap.xml`);

  expect(response.status(), 'the sitemap answers').toBe(200);

  const paths = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname);

  expect(paths.length, 'the sitemap lists pages').toBeGreaterThan(0);
  expect(sitemapCoverage(paths), 'a page the site gained since the copy in tests/a11y/website/pages.mjs was taken: '
    + 'add it there (with the website repository\'s id), or under COLLECTIONS or NOT_SCANNED').toEqual([]);
});

test.describe('website axe', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test.describe.configure({ timeout: TIMEOUT });

  for (const viewport of WEBSITE_THEMES) {
    for (const entry of WEBSITE_PAGES.filter(item => !item.viewports || item.viewports.includes(viewport))) {
      test(`${entry.id} at ${viewport}`, async({ page }, testInfo) => {
        await scan(page, testInfo, entry, viewport);
      });
    }
  }
});

/**
 * Opens a page at a width, reaches its state, scans it and writes the scan.
 *
 * @param page The page.
 * @param testInfo The test.
 * @param entry The page.
 * @param viewport The width.
 */
async function scan(page: Page, testInfo: TestInfo, entry: (typeof WEBSITE_PAGES)[number], viewport: string): Promise<void> {
  const started = Date.now();
  const pageErrors: string[] = [];
  const { url, guard, requests } = await openWebsitePage(page, entry, { viewport, baseUrl: BASE_URL, pageErrors, deadline: TIMEOUT / 2 });

  await WEBSITE_STATES[entry.state as WebsiteState](page);
  if (entry.state !== 'none') {
    await settleWebsite(page, requests, TIMEOUT / 4);
  }

  const expected = { 'form-sent': 1, 'booker-booked': 1 }[entry.state] ?? 0;

  // The positive control of the guard: a state that writes had its write caught on the page, and no other state wrote
  // anything that reached the page's answer. Every other write was aborted (`refusedWrites` in the scan).
  expect(guard.answered.length, `the ${entry.state} state's write was answered on the page, ${expected} time(s): ${guard.answered.join(', ')}`).toBe(expected);

  const results = await new AxeBuilder({ page }).options({ ancestry: true }).withTags(WCAG_TAGS).analyze();
  const violations = [...results.violations, ...results.incomplete.filter(result => result.id === 'scrollable-region-focusable')];
  const scansDir = path.join(testInfo.project.outputDir, 'scans');

  mkdirSync(scansDir, { recursive: true });
  await measureNodes(page, violations);

  const marks = marksForScan({
    findings: findingsFromScan({ page: entry.id, theme: viewport, violations }),
    entries: BASELINE_ENTRIES.filter(item => item.page === entry.id && item.theme === viewport),
    pictured: PICTURED.get(`${entry.id}|${viewport}`),
  });
  let screenshot = SCREENSHOTS && marks.length > 0 ? `${entry.id}--${viewport}.jpg` : null;
  let clip = null;

  if (screenshot) {
    clip = await outlineMarks(page, marks);
    try {
      await page.screenshot({ path: path.join(scansDir, screenshot), type: 'jpeg', quality: 60, fullPage: true, clip, timeout: SCREENSHOT_TIMEOUT });
    } catch (error) {
      testInfo.annotations.push({ type: 'screenshot-skipped', description: String(error).slice(0, 300) });
      screenshot = null;
      clip = null;
    }
  }
  for (const error of pageErrors) {
    testInfo.annotations.push({ type: 'page-error', description: error.slice(0, 500) });
  }

  const record = {
    page: entry.id,
    theme: viewport,
    fixture: entry.route,
    url,
    state: entry.state,
    axeCoreVersion: results.testEngine.version,
    timestamp: results.timestamp,
    durationMs: Date.now() - started,
    counts: { violations: violations.length, incomplete: results.incomplete.length, passes: results.passes.length, inapplicable: results.inapplicable.length },
    violations,
    incomplete: results.incomplete.map(result => ({ id: result.id, impact: result.impact, nodes: result.nodes.length })),
    screenshot,
    clip,
    marks: marks.map(({ selectors, ...mark }) => mark),
    pageErrors: pageErrors.map(error => error.slice(0, 500)),
    blockedHosts: [...guard.blocked].sort(),
    answeredWrites: guard.answered,
    refusedWrites: guard.refused,
  };
  const file = path.join(scansDir, `${entry.id}--${viewport}.json`);

  writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
  await testInfo.attach('axe-scan', { path: file, contentType: 'application/json' });
}

/**
 * Outlines and numbers every node of every mark in an overlay that takes no pointer events, and returns the page area
 * to photograph, as the docs scan does.
 *
 * @param page The page.
 * @param marks The marks.
 * @returns The clip, in page coordinates.
 */
async function outlineMarks(page: Page, marks: ScanMark[]) {
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

        box.style.cssText = `position:absolute;left:${left - 2}px;top:${top - 2}px;width:${Math.max(rect.width, 8) + 4}px;`
          + `height:${Math.max(rect.height, 8) + 4}px;outline:3px solid ${colors[mark.status]};box-sizing:border-box`;
        label.textContent = String(mark.n);
        label.style.cssText = 'position:absolute;left:-3px;top:-22px;min-width:18px;padding:1px 5px;border-radius:9px;'
          + `background:${colors[mark.status]};color:#fff;font:700 12px/18px system-ui,sans-serif;text-align:center`;
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

    const top = Math.max(0, Math.min(...areas.map(area => area.top)) - 24);
    const bottom = Math.min(height, top + maxHeight, Math.max(...areas.map(area => area.bottom)) + 24);

    return { x: 0, y: Math.round(top), width, height: Math.max(1, Math.round(bottom - top)) };
  }, [marks, MARK_COLORS, MAX_CLIP_HEIGHT] as const);
}
