import { test, type Page } from '@playwright/test';
import { siteCheckId, siteOf } from '../../lib/a11y-site-checks.mjs';
import { distinctName } from '../../lib/contrast.mjs';
import { forcedColorsFindings, longRunningFindings, motionFindings } from '../../lib/motion.mjs';
import { walkProblem, walkVerdict } from '../../lib/site-keyboard.mjs';
import { STATE_SIGNATURE, stateLostFindings } from '../../lib/site-visual.mjs';
import { watchAnimations } from '../checks/animations';
import { openAxSession } from '../checks/walker';
import { attachEvidence, readEnvironment, type EvidenceFinding } from '../evidence';
import { indicator } from './focus';
import { declareSiteTarget, installSentinels, instantScrolling, isEmbed, tabWalk, walkBudget, type SiteStop } from './harness';
import { siteDefinition } from './sites';

/**
 * Forced colors and motion on a site (`<site>-forced-colors-motion`): 2.2.2, 2.3.3, and the forced-colors support of
 * 1.4.1 and 2.4.7, on the site's sample, in the light scheme (forced colors replaces the scheme's colors). The
 * verdicts are `lib/motion.mjs` and `lib/site-visual.mjs`; the animation watch is the product check's
 * (`a11y/checks/animations.ts`).
 *
 * - **At rest** (`at-rest`, 2.2.2): each page at rest watched for five seconds without the reduced-motion
 *   preference. What moves or blinks from the watch's first frame to its last, and repeats without end or lasts five
 *   seconds, has no way to pause it.
 * - **An interaction** (2.3.3): each popup state opened from the keyboard, watched for 1.5 seconds with the
 *   preference (`interaction-reduced-motion`) and without it (`interaction-motion-allowed`, which evaluates nothing:
 *   it shows what the preference turned off).
 * - **Forced colors** (`forced-colors`): with `forcedColors: 'active'`, the focus indicator of each stop shape the Tab
 *   walk passes (at most `SHAPES`) must change the screen, and an element in a state shown by its style (the current
 *   page, a selected tab, a pressed button) must still differ from a sibling without it.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the site checks beyond axe".
 */

const SITE = siteDefinition(siteOf(process.env.HOT_A11Y_SITE));
const CHECK = siteCheckId(SITE.id, 'forced-colors-motion');
const THEME = 'light';
// A control that pauses what moves on its own (the website's "Pause animations").
const PAUSE = /^(pause|stop)\b/i;
const WATCH_MS = 5000;
const INTERACTION_MS = 1500;
const SHAPES = 15;
// The attributes that put an element in a state a style shows.
const STATES = ['aria-current="page"', 'aria-current="true"', 'aria-selected="true"', 'aria-pressed="true"', 'aria-checked="true"'];

test.describe(CHECK, () => {
  const atRest = SITE.sample.filter(entry => entry.state === 'none');

  for (const entry of atRest) {
    test(`${entry.id} at rest`, async({ page }, testInfo) => {
      const target = declareSiteTarget(testInfo, entry, THEME, SITE, 'at-rest');
      const startedAt = Date.now();
      const pageErrors: string[] = [];

      await page.emulateMedia({ reducedMotion: 'no-preference' });
      // Opened without waiting for the animations, the page has loaded, its fonts are ready and two frames have passed,
      // as the product check settles. `SITE.settle()`, or an open that waits for every finite animation to end, would
      // wait out one of five to ten seconds before the watch starts, and fail on a longer one instead of finding it.
      await SITE.open(page, entry, { theme: THEME, pageErrors, animations: false });

      const environment = await readEnvironment(page);
      const { animations, frames } = await watchAnimations(page, WATCH_MS);
      let findings = longRunningFindings({ frames, animations }) as EvidenceFinding[];
      let paused: { control: string; animations: unknown[]; frames: unknown } | null = null;
      const control = page.getByRole('button', { name: PAUSE }).first();

      // 2.2.2 is met by a way to pause: a page that moves on its own and offers a pause control has it pressed from
      // the keyboard and is watched again, and only what still moves after it is a finding.
      if (findings.length > 0 && await control.count() > 0 && await control.isVisible()) {
        const name = (await control.getAttribute('aria-label')) ?? (await control.innerText());

        await control.focus();
        await page.keyboard.press('Enter');

        const after = await watchAnimations(page, WATCH_MS);
        const still = new Set(longRunningFindings(after).map(item => item.selector));

        paused = { control: name, ...after };
        findings = findings.filter(item => still.has(item.selector)).map(item => ({ ...item, measured: { ...item.measured, pauseControl: name } }));
      }

      await attachEvidence(testInfo, {
        target, startedAt, environment, pageErrors, criteria: ['2.2.2'],
        findings,
        detail: { animations, frames, paused },
      });
    });

    test(`${entry.id} in forced colors`, async({ page }, testInfo) => {
      const target = declareSiteTarget(testInfo, entry, THEME, SITE, 'forced-colors');
      const startedAt = Date.now();
      const pageErrors: string[] = [];

      await page.emulateMedia({ forcedColors: 'active' });

      // The page as the walk starts from, again after a walk whose Tab loaded another page.
      const ready = async() => {
        await SITE.open(page, entry, { theme: THEME, pageErrors });
        await SITE.settle(page);
        await instantScrolling(page);
        await installSentinels(page);
      };

      await ready();

      const environment = await readEnvironment(page);
      const measured = await forcedColors(page, ready);

      await attachEvidence(testInfo, { target, startedAt, environment, pageErrors, criteria: ['1.4.1', '2.4.7'], ...measured });
    });
  }

  for (const entry of SITE.sample.filter(item => item.state !== 'none' && SITE.popups[item.state])) {
    for (const reducedMotion of [true, false]) {
      const variant = reducedMotion ? 'interaction-reduced-motion' : 'interaction-motion-allowed';

      test(`${entry.id} ${variant}`, async({ page }, testInfo) => {
        const target = declareSiteTarget(testInfo, entry, THEME, SITE, variant);
        const startedAt = Date.now();
        const pageErrors: string[] = [];

        await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
        await SITE.open(page, entry, { theme: THEME, pageErrors });
        await SITE.settle(page);

        const environment = await readEnvironment(page);
        const watching = watchAnimations(page, INTERACTION_MS);

        await SITE.reach(page, entry);

        const { animations } = await watching;
        const step = `open ${entry.state} from the keyboard`;

        await attachEvidence(testInfo, {
          target, startedAt, environment, pageErrors,
          // The run without the preference shows what the preference turned off; it evaluates nothing.
          criteria: reducedMotion ? ['2.3.3'] : [],
          findings: motionFindings({ reducedMotion, step, animations }) as EvidenceFinding[],
          detail: { animations },
        });
      });
    }
  }
});

/**
 * The forced-colors measurements of a page at rest: the focus indicator of each stop shape, and each element in a
 * state against a sibling without it.
 *
 * @param page The page, with forced colors on.
 * @param ready Opens the page again as the walk started from it.
 * @returns The findings, the problems and the detail.
 */
async function forcedColors(page: Page, ready: () => Promise<void>) {
  const findings: EvidenceFinding[] = [];
  const problems: string[] = [];
  const cdp = await openAxSession(page);
  const budget = await walkBudget(page, SITE.grid);
  const walk = await tabWalk(page, cdp, SITE, { direction: 'forward', budget, ax: false });
  const verdict = walkVerdict(walk);
  const cutShort = walkProblem(verdict, budget);

  // A walk short of the end leaves its target unmeasured; the indicators and states are then read on this page again.
  if (cutShort) {
    problems.push(cutShort);
  }
  if (verdict === 'navigated') {
    await ready();
  }
  const shapes = new Map<string, SiteStop>();

  for (const stop of walk.stops.filter(item => item.region === 'page' && item.hidden === null && !item.ariaHidden && !isEmbed(item))) {
    if (!shapes.has(stop.shape) && shapes.size < SHAPES) {
      shapes.set(stop.shape, stop);
    }
  }

  const names: string[] = [];
  const indicators = [];

  for (const [shape, stop] of shapes) {
    const name = distinctName(shape, names);

    names.push(name);

    const measured = await indicator(page, stop);

    if (measured === null) {
      problems.push(`${name}: the focus could not be put back on it, or scrolling did not bring it into view, to measure its indicator`);
      continue;
    }
    indicators.push({ selector: name, changed: measured.change.changed });
    findings.push(...forcedColorsFindings({ part: 'focus', selector: name, step: 'Tab', changed: measured.change.changed }) as EvidenceFinding[]);
  }

  const states = await stateSignatures(page);

  for (const state of states) {
    findings.push(...stateLostFindings(state) as EvidenceFinding[]);
  }

  return { findings, problems, detail: { stops: walk.stops.length, indicators, states } };
}

/**
 * Each element in a state a style shows, with a sibling of the same kind without it, and both their style
 * signatures (`STATE_SIGNATURE`) with forced colors off and on. One per state and shape.
 *
 * @param page The page.
 * @returns The pairs.
 */
async function stateSignatures(page: Page) {
  const read = () => page.evaluate(([states, properties]) => {
    const pairs: Array<{ key: string; selector: string; state: string; element: Record<string, string>; sibling: Record<string, string> }> = [];
    // What a transparent background shows: the background of the nearest ancestor that paints one, or the canvas.
    const behind = (element: Element) => {
      for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const color = getComputedStyle(ancestor).backgroundColor;

        if (color !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(color)) {
          return color;
        }
      }

      return 'canvas';
    };
    const signature = (element: Element) => ({
      ...Object.fromEntries(properties.map(property => [property, getComputedStyle(element).getPropertyValue(property)])),
      behind: behind(element),
    });

    for (const state of states) {
      const [attribute] = state.split('=');

      for (const element of document.querySelectorAll(`[${state}]`)) {
        if (!element.checkVisibility({ visibilityProperty: true, opacityProperty: true }) || element.closest('[aria-hidden="true"]')) {
          continue;
        }

        const container = element.parentElement?.parentElement ?? element.parentElement;
        const sibling = [...(container?.querySelectorAll(element.tagName) ?? [])].find(other => other !== element
          && !other.hasAttribute(attribute) && other.checkVisibility({ visibilityProperty: true, opacityProperty: true }));
        const meaningful = [...element.classList].map(name => name.replace(/^_([A-Za-z][\w-]*?)_[a-z0-9]{5}_\d+$/, '$1'))
          .find(name => !/^astro-|^sl-(?:flex|hidden|block|inline)$|:|-(?=[a-z]*\d)[a-z0-9]{5,}$/.test(name));
        const selector = `${element.tagName.toLowerCase()}${meaningful ? `.${meaningful}` : ''}[${state}]`;

        if (sibling && !pairs.some(pair => pair.selector === selector)) {
          pairs.push({ key: selector, selector, state: `[${state}]`, element: signature(element), sibling: signature(sibling) });
        }
      }
    }

    return pairs;
  }, [STATES, STATE_SIGNATURE] as const);

  await page.emulateMedia({ forcedColors: 'none' });

  const normal = await read();

  await page.emulateMedia({ forcedColors: 'active' });

  const forced = await read();

  return normal.flatMap((pair) => {
    const other = forced.find(item => item.key === pair.key);

    return other ? [{ selector: pair.selector, state: pair.state, element: { normal: pair.element, forced: other.element },
      sibling: { normal: pair.sibling, forced: other.sibling } }] : [];
  });
}
