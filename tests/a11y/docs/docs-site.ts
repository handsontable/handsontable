import { expect, type Page, type Response } from '@playwright/test';
import { DESKTOP_VIEWPORT, PHONE_VIEWPORT, docsUrl, type DocsPage, type DocsState } from './pages.mjs';

/**
 * How a test opens a docs page and reaches its state: the docs site scan (`docs-axe.spec.ts`) and the site checks
 * beyond axe (`a11y/sites/`) both open pages here, so a check measures the DOM the scan reads. Policy:
 * `tests/AGENTS.md`, "A11y: the docs site scan" and "A11y: the site checks beyond axe".
 *
 * What makes two runs of the same deploy agree:
 *
 * - Third-party scripts that draw late, from a live service, or not at all depending on the region are blocked
 *   (`BLOCKED_HOSTS`): the changelog bell and its panel (Headway), the consent banner (Cookiebot), the GitHub
 *   stars count (the unauthenticated GitHub API allows 60 requests an hour, and a run makes several hundred), and
 *   the error reporter, so a run never files Sentry events. A run therefore says nothing about those widgets.
 * - The color scheme is set before the first paint (`colorScheme` and Starlight's own `starlight-theme` key), and
 *   `openDocsPage()` checks that the document took it.
 * - The examples have finished loading (no `.hot-example-preview--loading` left), the fonts are ready, and two
 *   animation frames have passed, before a state is reached; after it, every finite animation has ended (a menu or
 *   a panel mid-open) and the code blocks' script has run (`settle()`).
 */

export const BLOCKED_HOSTS = /(^|\.)(headwayapp\.co|headway-widget\.net|cookiebot\.com|api\.github\.com|sentry-cdn\.com|sentry\.io|googletagmanager\.com|google-analytics\.com)$/;
// Starlight's DocSearch button; only production builds render search.
export const SEARCH_BUTTON = '.DocSearch-Button, button[data-open-modal]';
export const EXAMPLES_TIMEOUT = 60_000;
// How long a settle gives the code blocks' script to make every overflowing block focusable (`settle()`).
const CODE_BLOCKS_TIMEOUT = 5_000;
// How long a settle waits for the finite animations to end before it names the ones that did not.
const ANIMATIONS_TIMEOUT = 10_000;
// How long a settle waits for the DOM to hold still: a grid an example builds after its data arrives.
export const STILL_TIMEOUT = 10_000;
// The pages already prepared, by the scheme they were prepared in: a page opened again (the keyboard check reopens
// one after a key that acted) keeps its routing, init script and error listener, which a second call would stack, so
// each uncaught error would be recorded once per visit.
const PREPARED = new WeakMap<Page, string>();

/**
 * Opens a docs page in a color scheme and waits until it is ready to measure: the viewport, the blocked hosts and
 * the scheme are set before the first request, the page answers with the status the entry expects and is not the
 * deploy's password wall, every example finished loading (unless `examples` is false), the scheme applied, and the
 * fonts are ready. Every page error from before the navigation lands in `pageErrors`; a page opened again keeps
 * the routing, the init script and the error listener of its first opening, so its errors land in that call's list.
 *
 * @param page The page.
 * @param entry The page entry.
 * @param options The run.
 * @param options.theme The color scheme (`light`, `dark`).
 * @param options.baseUrl The docs base URL.
 * @param options.pageErrors Where the page's uncaught errors go.
 * @param options.examples Whether to wait for the examples to finish loading.
 * @returns The URL opened and its response.
 */
export async function openDocsPage(page: Page, entry: DocsPage, { theme, baseUrl, pageErrors, examples = true }: {
  theme: string;
  baseUrl: string;
  pageErrors: string[];
  examples?: boolean;
}): Promise<{ url: string; response: Response | null }> {
  const url = docsUrl(entry, theme, baseUrl);

  await page.setViewportSize(entry.viewport === 'phone' ? PHONE_VIEWPORT : DESKTOP_VIEWPORT);
  if (!PREPARED.has(page)) {
    PREPARED.set(page, theme);
    await page.context().route(target => BLOCKED_HOSTS.test(target.hostname), route => route.abort());
    await page.addInitScript((scheme) => {
      try {
        localStorage.setItem('starlight-theme', scheme);
      } catch {
        // A storage that throws leaves the media query to decide, which `colorScheme` already set.
      }
    }, theme);
    page.on('pageerror', error => pageErrors.push(String(error.stack ?? error)));
  }
  expect(PREPARED.get(page), 'a page is opened again in the scheme it was first opened in').toBe(theme);

  const response = await page.goto(url, { waitUntil: 'load' });

  expect(response?.status(), `${url} answers with ${entry.status ?? 200}`).toBe(entry.status ?? 200);
  await expect(page.getByText('Password protected site'), 'the deploy is not behind its password wall').toHaveCount(0);
  if (examples) {
    await expect(page.locator('.hot-example-preview--loading'), 'every example finished loading').toHaveCount(0, { timeout: EXAMPLES_TIMEOUT });
  }
  expect(await page.evaluate(() => document.documentElement.dataset.theme), `the ${theme} color scheme applied`).toBe(theme);
  await page.evaluate(async() => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  return { url, response };
}

/**
 * Waits until the page holds still for a measurement, and says whether the DOM did.
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
 *   A page that never holds still within `STILL_TIMEOUT` is measured as it is, and the caller annotates it.
 *
 * @param page The page.
 * @returns Whether the DOM held still.
 */
export async function settle(page: Page): Promise<boolean> {
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
 * Whether the page renders a control only some builds have.
 *
 * @param page The page.
 * @param requirement The control.
 * @returns The verdict.
 */
export async function hasRequirement(page: Page, requirement: NonNullable<DocsPage['requires']>): Promise<boolean> {
  const selector = { search: SEARCH_BUTTON }[requirement];

  return (await page.locator(selector).count()) > 0;
}

/**
 * Presses Enter on a header control, which takes the focus first, the way a keyboard user opens it.
 *
 * @param page The page.
 * @param selector The control.
 */
export async function pressEnterOn(page: Page, selector: string): Promise<void> {
  const control = page.locator(selector).first();

  await expect(control, `${selector} is on the page`).toBeVisible();
  await control.focus();
  await page.keyboard.press('Enter');
}

/**
 * The state each page is measured in. A menu or a panel is opened from the keyboard, so the measured DOM is the
 * one a keyboard user reaches.
 */
export const DOCS_STATES: Record<DocsState, (page: Page) => Promise<void>> = {
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
