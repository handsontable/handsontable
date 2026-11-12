import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { siteCheckId, siteOf } from '../../lib/a11y-site-checks.mjs';
import {
  inputFindings,
  popupFindings,
  shortcutFindings,
  skipLinkFindings,
  unreachableFindings,
  walkFindings,
  walkProblem,
  walkVerdict,
} from '../../lib/site-keyboard.mjs';
import { openAxSession } from '../checks/walker';
import { hasRequirement } from '../docs/docs-site';
import { attachEvidence, readEnvironment, type EvidenceFinding } from '../evidence';
import {
  declareSiteTarget,
  focusByKey,
  focusSentinel,
  installSentinels,
  instantScrolling,
  openDialogs,
  readStop,
  tabWalk,
  unfocusableControls,
  walkBudget,
  type SiteStop,
} from './harness';
import { siteDefinition, type Site, type SitePage } from './sites';

/**
 * The keyboard walk of a site (`<site>-keyboard`): 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 3.2.1, 3.2.2 and 4.1.2, with
 * real keys, on the site's sample (one page per template, and each popup state), in the light scheme (a color
 * scheme moves no stop). The verdicts are `lib/site-keyboard.mjs`; the browser half is `harness.ts`.
 *
 * - **A page at rest:** Tab from a sentinel before the page's first element to one after its last, reading each
 *   stop's role and name from the accessibility tree; a walk that cycles gets Escape and more Tabs before it is a
 *   trap. Then the skip link (first stop, visible on focus, its next Tab in the main content), the controls no key
 *   reaches, an input on each kind of form control the walk passed (last: it can change the page), and, on the
 *   site's shortcut pages, every printable key with nothing focused, the page reloaded after a key that acted.
 * - **A popup state:** the popup opened from the keyboard, then whether Tab or ArrowDown reaches a control inside
 *   it, whether Tab stays inside a modal, and whether Escape closes it and gives the focus back to its trigger.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe".
 */

const SITE = siteDefinition(siteOf(process.env.HOT_A11Y_SITE));
const CHECK = siteCheckId(SITE.id, 'keyboard');
const THEME = 'light';
const SHORTCUT_KEYS = [...'abcdefghijklmnopqrstuvwxyz0123456789', '/', '?', '.', ',', '[', ']', '-', '=', '`', '\'', ';'];
// The key an input sends to each kind of form control.
const INPUT_KEYS: Record<string, string> = { select: 'ArrowDown', checkbox: 'Space', radio: 'ArrowDown' };

test.describe(CHECK, () => {
  for (const entry of SITE.sample) {
    test(entry.id, async({ page }, testInfo) => {
      const target = declareSiteTarget(testInfo, entry, THEME, SITE);
      const startedAt = Date.now();
      const pageErrors: string[] = [];

      await SITE.open(page, entry, { theme: THEME, pageErrors });
      if (entry.requires && !(await hasRequirement(page, entry.requires))) {
        throw new Error(`${entry.id}: ${page.url()} renders no ${entry.requires}`);
      }
      await SITE.settle(page);
      await instantScrolling(page);

      const environment = await readEnvironment(page);
      const cdp = await openAxSession(page);
      const measured = entry.state === 'none'
        ? await atRest(page, cdp, entry, pageErrors)
        : await popup(page, entry);

      await attachEvidence(testInfo, { target, startedAt, environment, pageErrors, ...measured });
    });
  }
});

/**
 * The page at rest: the walk, the skip link, the unreachable controls, the inputs and the shortcuts.
 *
 * @param page The page.
 * @param cdp The accessibility session.
 * @param entry The page.
 * @param pageErrors The page's errors, which a reload keeps collecting.
 * @returns The findings, the criteria evaluated, the problems and the detail.
 */
async function atRest(page: Page, cdp: CDPSession, entry: SitePage, pageErrors: string[]) {
  const findings: EvidenceFinding[] = [];
  const problems: string[] = [];
  const criteria = ['2.1.1', '2.1.2', '2.4.1', '2.4.3', '3.2.1', '3.2.2', '4.1.2'];

  await installSentinels(page);

  const budget = await walkBudget(page, SITE.grid);
  const walk = await tabWalk(page, cdp, SITE, { direction: 'forward', budget });
  const verdict = walkVerdict(walk);
  let escaped = false;

  if (verdict === 'cycle') {
    const cycle = new Set(walk.stops.map(stop => stop.key));

    await page.keyboard.press('Escape');
    for (let press = 0; press < 5 && !escaped; press++) {
      await page.keyboard.press('Tab');

      const stop = await readStop(page, cdp, { grid: SITE.grid, startUrl: page.url(), dialogs: 0, ax: false });

      escaped = !cycle.has(stop.key);
    }
  }
  const cutShort = walkProblem(verdict, budget);

  if (cutShort) {
    problems.push(cutShort);
  }
  // The measurements after the walk read this page, with its sentinels: a Tab that loaded another page left neither.
  if (verdict === 'navigated') {
    await reopen(page, entry, pageErrors);
  }
  findings.push(...walkFindings({ stops: walk.stops, verdict, escaped, gridTrap: walk.gridTrap }) as EvidenceFinding[]);
  findings.push(...await skipLink(page, cdp, walk.stops) as EvidenceFinding[]);
  findings.push(...unreachableFindings(await unfocusableControls(page, SITE.grid)) as EvidenceFinding[]);

  const shortcuts = SITE.shortcutPages.includes(entry.id) ? await pressShortcuts(page, entry, pageErrors) : null;

  if (shortcuts) {
    criteria.push('2.1.4');
    findings.push(...shortcutFindings(shortcuts) as EvidenceFinding[]);
  }

  const inputs = await sendInputs(page, walk.stops);

  findings.push(...inputFindings(inputs) as EvidenceFinding[]);

  return {
    findings,
    criteria,
    problems,
    detail: { verdict, escaped, gridTrap: walk.gridTrap, budget, stops: walk.stops.map(({ box, ...stop }) => stop), shortcuts, inputs },
  };
}

/**
 * The skip link: whether the page has one, whether the first stop is it, whether it shows when it has the focus,
 * and whether the Tab after Enter on it lands in the main content.
 *
 * @param page The page.
 * @param cdp The accessibility session.
 * @param stops The walk's stops.
 * @returns The findings.
 */
async function skipLink(page: Page, cdp: CDPSession, stops: SiteStop[]) {
  const link = await page.evaluate(() => {
    const main = document.querySelector('main, [role="main"]');
    const candidate = [...document.querySelectorAll('a[href^="#"]')].find(element => /skip|jump to|main content/i
      .test(`${element.textContent} ${element.getAttribute('aria-label') ?? ''}`)
      && (!main || Boolean(main.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING)));

    if (!candidate) {
      return null;
    }

    const classes = [...candidate.classList].find(name => !/^astro-/.test(name));

    return { selector: `a${classes ? `.${classes}` : ''}[href="${candidate.getAttribute('href')}"]`, href: candidate.getAttribute('href') };
  });

  if (!link) {
    return [];
  }

  const first = stops.find(stop => stop.region !== 'start');
  const isFirst = await page.evaluate(selector => document.querySelector(selector) !== null, link.selector) && first?.region === 'page'
    && await focusSentinel(page, 'start').then(() => page.keyboard.press('Tab'))
      .then(() => page.evaluate(selector => document.activeElement === document.querySelector(selector), link.selector));
  let visible: boolean | null = null;
  let landsInMain: boolean | null = null;

  if (isFirst) {
    const stop = await readStop(page, cdp, { grid: SITE.grid, startUrl: page.url(), dialogs: 0, ax: false });
    const viewport = page.viewportSize()!;

    visible = stop.hidden === null && stop.box !== null && stop.box.y < viewport.height && stop.box.y + stop.box.height > 0
      && stop.box.x < viewport.width && stop.box.x + stop.box.width > 0;
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    landsInMain = (await readStop(page, cdp, { grid: SITE.grid, startUrl: page.url(), dialogs: 0, ax: false })).inMain;
  }

  return skipLinkFindings({ present: true, first: Boolean(isFirst), visible, landsInMain, selector: link.selector });
}

/**
 * Presses every printable key with nothing focused and records what each did: a navigation, a dialog opened, or the
 * focus moved onto an element. The page is opened again after a key that acted, so the next key starts from the
 * page as it loaded.
 *
 * @param page The page.
 * @param entry The page entry.
 * @param pageErrors The page's errors.
 * @returns What each key did.
 */
async function pressShortcuts(page: Page, entry: SitePage, pageErrors: string[]) {
  const results: Array<{ key: string; navigated: boolean; dialogOpened: boolean; focused: string | null }> = [];
  const blur = () => page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });

  await blur();
  for (const key of SHORTCUT_KEYS) {
    const url = page.url();
    const dialogs = await openDialogs(page);

    await page.keyboard.press(key);

    const after = await page.evaluate(() => new Promise<{ focused: string | null }>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const element = document.activeElement;

        resolve({ focused: element && element !== document.body && element !== document.documentElement
          ? `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}` : null });
      }));
    })).catch(() => ({ focused: null }));
    const result = { key, navigated: page.url() !== url, dialogOpened: (await openDialogs(page).catch(() => dialogs)) > dialogs, focused: after.focused };

    results.push(result);
    if (result.navigated || result.dialogOpened || result.focused) {
      await reopen(page, entry, pageErrors);
      await blur();
    }
  }

  return results;
}

/**
 * Opens the page again as it loaded.
 *
 * @param page The page.
 * @param entry The page entry.
 * @param pageErrors The page's errors.
 */
async function reopen(page: Page, entry: SitePage, pageErrors: string[]): Promise<void> {
  await SITE.open(page, entry, { theme: THEME, pageErrors });
  await SITE.settle(page);
  await instantScrolling(page);
  await installSentinels(page);
}

/**
 * Sends an input to the first form control of each shape the walk stopped on, and records whether it navigated,
 * opened a dialog or moved the focus away.
 *
 * @param page The page.
 * @param stops The walk's stops.
 * @returns What each input did.
 */
async function sendInputs(page: Page, stops: SiteStop[]) {
  const results: Array<{ selector: string; key: string; navigated: boolean; dialogOpened: boolean; focusMoved: boolean }> = [];
  const seen = new Set<string>();

  for (const stop of stops.filter(item => item.region === 'page' && item.control !== null && !item.hidden)) {
    if (seen.has(stop.shape) || !(await focusByKey(page, stop.key))) {
      continue;
    }
    seen.add(stop.shape);

    const url = page.url();
    const dialogs = await openDialogs(page);
    const key = INPUT_KEYS[stop.control!];

    await page.keyboard.press(key);

    const focusMoved = await page.evaluate(path => new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        let element: Element | null = document.documentElement;

        for (const part of path.split('>')) {
          element = element?.children[Number(part.split(':')[1])] ?? null;
        }
        resolve(document.activeElement !== element);
      }));
    }), stop.key).catch(() => true);

    results.push({ selector: stop.shape, key, navigated: page.url() !== url, dialogOpened: (await openDialogs(page).catch(() => dialogs)) > dialogs, focusMoved });
  }

  return results;
}

/**
 * A popup state: opened from the keyboard, its items reached, a modal held, and Escape.
 *
 * @param page The page.
 * @param entry The page.
 * @returns The findings, the criteria evaluated, the problems and the detail.
 */
async function popup(page: Page, entry: SitePage) {
  const definition = popupOf(SITE, entry);

  await SITE.reach(page, entry);
  await SITE.settle(page);

  const container = page.locator(definition.container).first();

  await expect(container, `the ${entry.state} popup opened`).toBeVisible();

  const inside = () => page.evaluate(selector => {
    const element = document.querySelector(selector);

    return Boolean(element && element.contains(document.activeElement) && document.activeElement !== element);
  }, definition.container);
  let reachedItem = await inside();
  const reachedBy = [] as string[];

  for (const key of ['ArrowDown', 'Tab']) {
    if (!reachedItem) {
      await page.keyboard.press(key);
      reachedItem = await inside();
      reachedBy.push(key);
    }
  }

  const modal = await page.evaluate(selector => {
    const element = document.querySelector(selector);

    return Boolean(element && (element.matches('[aria-modal="true"], dialog:modal') || element.closest('[aria-modal="true"], dialog:modal')));
  }, definition.container);
  let leftModal = false;

  if (modal && reachedItem) {
    const presses = await page.evaluate(selector => (document.querySelector(selector)?.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length ?? 0) + 2,
      definition.container);

    for (let press = 0; press < Math.min(presses, 60) && !leftModal; press++) {
      await page.keyboard.press('Tab');
      leftModal = !(await page.evaluate(selector => Boolean(document.querySelector(selector)?.contains(document.activeElement)), definition.container));
    }
  }

  let closedOnEscape = false;

  // A popup that slides away is still on screen until its animation ends, so each Escape is judged once the page
  // holds still again.
  for (let press = 0; press < 2 && !closedOnEscape; press++) {
    await page.keyboard.press('Escape');
    await SITE.settle(page).catch(() => false);
    closedOnEscape = await page.evaluate(([selector, trigger]) => {
      const element = document.querySelector(selector);
      // Closed is out of sight: not rendered, or moved out of the viewport (a panel that slides away stays
      // rendered), or its trigger says so.
      const box = element?.getBoundingClientRect();
      const onScreen = box && Math.min(box.right, innerWidth) - Math.max(box.left, 0) > 10 && Math.min(box.bottom, innerHeight) - Math.max(box.top, 0) > 10;

      return !element || !element.checkVisibility({ visibilityProperty: true, opacityProperty: true }) || !onScreen
        || document.querySelector(trigger)?.getAttribute('aria-expanded') === 'false';
    }, [definition.container, definition.trigger] as const);
  }

  const focusReturned = await page.evaluate(trigger => [...document.querySelectorAll(trigger)].some(element => element.contains(document.activeElement)), definition.trigger);
  const focusAfter = await page.evaluate(() => {
    const element = document.activeElement;

    return element ? `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList[0] ? `.${element.classList[0]}` : ''}` : 'none';
  });
  const findings = popupFindings({ state: entry.state, selector: definition.trigger, reachedItem, closedOnEscape, focusReturned, modal, leftModal });

  return {
    findings: findings as EvidenceFinding[],
    criteria: ['2.1.1', '2.1.2', '2.4.3'],
    problems: [] as string[],
    detail: { popup: definition, reachedItem, reachedBy, modal, leftModal, closedOnEscape, focusReturned, focusAfter },
  };
}

/**
 * The popup a state opens.
 *
 * @param site The site.
 * @param entry The page.
 * @returns The popup.
 */
function popupOf(site: Site, entry: SitePage) {
  const definition = site.popups[entry.state];

  if (!definition) {
    throw new Error(`${site.id} defines no popup for the state ${entry.state} (a11y/sites/sites.ts)`);
  }

  return definition;
}
