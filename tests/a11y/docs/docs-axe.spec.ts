import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
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
import {
  DESKTOP_VIEWPORT,
  DOCS_PAGES,
  DOCS_THEMES,
  PHONE_VIEWPORT,
  docsBaseUrl,
  docsUrl,
  type DocsPage,
  type DocsState,
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
 * What makes two runs of the same deploy agree:
 *
 * - Third-party scripts that draw late, from a live service, or not at all depending on the region
 *   are blocked (`BLOCKED_HOSTS`): the changelog bell and its panel (Headway), the consent banner
 *   (Cookiebot), the GitHub stars count (the unauthenticated GitHub API allows 60 requests an hour, and
 *   a run makes several hundred), and the error reporter, so a scan never files Sentry events. The
 *   scan therefore says nothing about those widgets; the PR that added the scan lists them as gaps. The
 *   document inside a video or design-file embed is left out the same way (`THIRD_PARTY_FRAMES`); the frame
 *   element stays in.
 * - The color scheme is set before the first paint (`colorScheme` and Starlight's own
 *   `starlight-theme` key), and the spec checks that the document took it.
 * - The examples have finished loading (no `.hot-example-preview--loading` left), the fonts are ready,
 *   and two animation frames have passed, before a state is reached; after it, every finite animation
 *   has ended (a menu or a panel mid-open) and the code blocks' script has run (`settle()`).
 */

const BASE_URL = docsBaseUrl(process.env.DOCS_A11Y_BASE_URL);
// `DOCS_A11Y_SCREENSHOTS=0` photographs nothing: the run that builds a baseline marks every finding new,
// and a screenshot per scan would make the HTML report hundreds of megabytes.
const SCREENSHOTS = process.env.DOCS_A11Y_SCREENSHOTS !== '0';
const BLOCKED_HOSTS = /(^|\.)(headwayapp\.co|headway-widget\.net|cookiebot\.com|api\.github\.com|sentry-cdn\.com|sentry\.io|googletagmanager\.com|google-analytics\.com)$/;
// The outline colors of the screenshot marks, as in the product scan: new, grown, a pictured known issue.
const MARK_COLORS: Record<ScanMark['status'], string> = { new: '#d03b3b', grown: '#b85a2f', known: '#1c5cab' };
// A docs page can be many screens long: a screenshot shows the marked part, at most this tall.
const MAX_CLIP_HEIGHT = 1600;
const EXAMPLES_TIMEOUT = 60_000;
// How long the scan gives the code blocks' script to make every overflowing block focusable (`settle()`).
const CODE_BLOCKS_TIMEOUT = 5_000;
// How long the scan waits for the finite animations to end before it names the ones that did not.
const ANIMATIONS_TIMEOUT = 10_000;
// How long the scan waits for the DOM to hold still: a grid an example builds after its data arrives.
const STILL_TIMEOUT = 10_000;
// How long a screenshot may take before the scan is kept without one.
const SCREENSHOT_TIMEOUT = 20_000;
// The embeds whose document is another service's (a video, a design file): axe reads into a frame, and what it
// finds there changes with that service, so the nodes inside such a frame are dropped and the frame itself stays
// (its title is the docs' own markup). axe's own `exclude` does not reach into a cross-origin frame here.
const THIRD_PARTY_FRAMES = ['iframe[src*="youtube.com"]', 'iframe[src*="youtube-nocookie.com"]', 'iframe[src*="figma.com"]'];
// Starlight's DocSearch button; only production builds render search.
const SEARCH_BUTTON = '.DocSearch-Button, button[data-open-modal]';

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
  const url = docsUrl(entry, theme, BASE_URL);
  const pageErrors: string[] = [];

  await page.setViewportSize(entry.viewport === 'phone' ? PHONE_VIEWPORT : DESKTOP_VIEWPORT);
  await page.context().route(target => BLOCKED_HOSTS.test(target.hostname), route => route.abort());
  await page.addInitScript((scheme) => {
    try {
      localStorage.setItem('starlight-theme', scheme);
    } catch {
      // A storage that throws leaves the media query to decide, which `colorScheme` already set.
    }
  }, theme);
  page.on('pageerror', error => pageErrors.push(String(error.stack ?? error)));

  const response = await page.goto(url, { waitUntil: 'load' });

  expect(response?.status(), `${url} answers with ${entry.status ?? 200}`).toBe(entry.status ?? 200);
  await expect(page.getByText('Password protected site'), 'the deploy is not behind its password wall').toHaveCount(0);
  await expect(page.locator('.hot-example-preview--loading'), 'every example finished loading').toHaveCount(0, { timeout: EXAMPLES_TIMEOUT });
  expect(await page.evaluate(() => document.documentElement.dataset.theme), `the ${theme} color scheme applied`).toBe(theme);
  await page.evaluate(async() => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

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
 * Waits until the page holds still for a scan, and says whether the DOM did.
 *
 * - Every finite animation ends (a menu or a panel that is opening). The wait is bounded: an animation still
 *   running or paused after `ANIMATIONS_TIMEOUT` fails the test with its name, rather than the test running
 *   out of time with none.
 * - The code blocks' script (Expressive Code) has made every code block that scrolls focusable: it adds
 *   `tabindex="0"` to an overflowing block a few hundred milliseconds after load, so a scan that lands first
 *   reports the block as a scrollable region the keyboard cannot reach, and the next run does not. A block
 *   the script never reaches stays a finding.
 * - The DOM holds still for 30 frames in a row: an example that builds its grid once its data arrives (the
 *   server-side data guide) is scanned with the grid. The count restarts on every change, inside one
 *   `evaluate`: `waitForFunction()` does not await a predicate's promise, so a promise there passes at once.
 *   A page that never holds still within `STILL_TIMEOUT` is scanned as it is, and the caller annotates it.
 *
 * @param page The page.
 * @returns Whether the DOM held still.
 */
async function settle(page: Page): Promise<boolean> {
  const unfinished = await page.evaluate(async(timeout) => {
    const finite = document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity);
    const deadline = new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = () => (performance.now() - start >= timeout ? resolve() : requestAnimationFrame(tick));

      requestAnimationFrame(tick);
    });

    await Promise.race([Promise.all(finite.map(animation => animation.finished.catch(() => undefined))), deadline]);

    return finite.filter(animation => animation.playState === 'running' || animation.playState === 'paused')
      .map((animation) => {
        const name = animation instanceof CSSAnimation ? animation.animationName
          : animation instanceof CSSTransition ? animation.transitionProperty : animation.id || 'a script animation';
        const target = (animation.effect as KeyframeEffect | null)?.target;

        return `${name} (${animation.playState}) on ${target ? `${target.tagName.toLowerCase()}.${String(target.className).split(' ')[0]}` : 'nothing'}`;
      });
  }, ANIMATIONS_TIMEOUT);

  if (unfinished.length > 0) {
    throw new Error(`animations still unfinished after ${ANIMATIONS_TIMEOUT} ms: ${unfinished.join(', ')}`);
  }
  await page.waitForFunction(() => [...document.querySelectorAll('.expressive-code pre')]
    .every(block => block.scrollWidth <= block.clientWidth || block.hasAttribute('tabindex')),
  undefined, { polling: 100, timeout: CODE_BLOCKS_TIMEOUT }).catch(() => undefined);

  return page.evaluate(timeout => new Promise<boolean>((resolve) => {
    const start = performance.now();
    const count = () => document.getElementsByTagName('*').length;
    let last = count();
    let still = 0;
    const tick = () => {
      const now = count();

      still = now === last ? still + 1 : 0;
      last = now;
      if (still >= 30) {
        resolve(true);
      } else if (performance.now() - start >= timeout) {
        resolve(false);
      } else {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }), STILL_TIMEOUT);
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
 * Whether the page renders a control only some builds have.
 *
 * @param page The page.
 * @param requirement The control.
 * @returns The verdict.
 */
async function hasRequirement(page: Page, requirement: NonNullable<DocsPage['requires']>): Promise<boolean> {
  const selector = { search: SEARCH_BUTTON }[requirement];

  return (await page.locator(selector).count()) > 0;
}

/**
 * Presses Enter on a header control, which takes the focus first, the way a keyboard user opens it.
 *
 * @param page The page.
 * @param selector The control.
 */
async function pressEnterOn(page: Page, selector: string): Promise<void> {
  const control = page.locator(selector).first();

  await expect(control, `${selector} is on the page`).toBeVisible();
  await control.focus();
  await page.keyboard.press('Enter');
}

/**
 * The state each page is scanned in. A menu or a panel is opened from the keyboard, so the scanned DOM
 * is the one a keyboard user reaches.
 */
const DOCS_STATES: Record<DocsState, (page: Page) => Promise<void>> = {
  none: async() => {},
  'versions-menu': async(page) => {
    await pressEnterOn(page, '#versions-trigger');
    await expect(page.locator('#versions-trigger')).toHaveAttribute('aria-expanded', 'true');
  },
  'support-menu': async(page) => {
    await pressEnterOn(page, '#support-trigger');
    await expect(page.locator('#support-trigger')).toHaveAttribute('aria-expanded', 'true');
  },
  // The panel is in the DOM and visible before it opens, so its open animation is what says it opened: the
  // focus moves into its text field once that animation has started (about 100 ms after the key), and
  // `settle()` then waits it out. A scan before the end read the page behind the panel as it was before
  // it opened, and reported the off-screen sidebar copy on some runs and not on others.
  'docs-assistant': async(page) => {
    await pressEnterOn(page, '#header-assistant-btn');
    await expect(page.locator('[role="dialog"]').locator('textarea, input').first()).toBeFocused();
  },
  search: async(page) => {
    await pressEnterOn(page, SEARCH_BUTTON);
    await expect(page.locator('.DocSearch-Modal, dialog[open]').first()).toBeVisible();
  },
  'phone-navigation': async(page) => {
    await pressEnterOn(page, '.mobile-menu-btn');
    await expect(page.locator('.mobile-menu-btn')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-nav-overlay')).toBeVisible();
  },
};

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
