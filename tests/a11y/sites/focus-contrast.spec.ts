import { test } from '@playwright/test';
import { siteCheckId, siteOf } from '../../lib/a11y-site-checks.mjs';
import { distinctName, focusFindings, obscuredFindings } from '../../lib/contrast.mjs';
import { walkProblem, walkVerdict } from '../../lib/site-keyboard.mjs';
import { boundaryFindings } from '../../lib/site-visual.mjs';
import { openAxSession } from '../checks/walker';
import { attachEvidence, readEnvironment, type EvidenceFinding } from '../evidence';
import { indicator, samplePoints } from './focus';
import { declareSiteTarget, installSentinels, instantScrolling, tabWalk, walkBudget, type SiteStop } from './harness';
import { siteDefinition } from './sites';

/**
 * Focus appearance and non-text contrast on a site (`<site>-focus-contrast`): 2.4.7, 2.4.11 and 1.4.11, on the site's
 * sample pages at rest, in every color scheme. The verdicts are `lib/contrast.mjs` (the focus indicator, a hidden
 * focus) and `lib/site-visual.mjs` (a text field's boundary).
 *
 * - **2.4.11:** a Tab walk forward and one back with Shift+Tab, 25 points of each stop sampled with
 *   `elementFromPoint()`. Going back, the browser scrolls a stop to the top of the viewport, where a sticky header
 *   is: that is where a focus ends up under it. One finding per shape and direction.
 * - **2.4.7 and 1.4.11, the indicator:** the first stop of each shape (at most `SHAPES`), captured with nothing
 *   focused and again once the focus arrives after a key press (what makes `:focus-visible` match), the change
 *   judged against the colors next to it.
 * - **1.4.11, the boundary:** each kind of text field and select at rest, its edge and its fill against the page
 *   around it.
 *
 * A popup state is left out: its controls' indicators sit next to each other and to the trigger's, so a capture
 * before the focus is never clean. Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the
 * site checks beyond axe".
 */

const SITE = siteDefinition(siteOf(process.env.HOT_A11Y_SITE));
const CHECK = siteCheckId(SITE.id, 'focus-contrast');
// How many shapes a page's indicator is measured on.
const SHAPES = 30;
const FIELDS = /^(input|textarea|select)\b/;

for (const theme of SITE.themes) {
  test.describe(`${CHECK} on ${theme}`, () => {
    test.use({ colorScheme: theme as 'light' | 'dark' });

    for (const entry of SITE.sample.filter(item => item.state === 'none')) {
      test(`${entry.id} on ${theme}`, async({ page }, testInfo) => {
        const target = declareSiteTarget(testInfo, entry, theme, SITE);
        const startedAt = Date.now();
        const pageErrors: string[] = [];

        // The page as a walk starts from, again after a walk whose Tab loaded another page.
        const ready = async() => {
          await SITE.open(page, entry, { theme, pageErrors });
          await SITE.settle(page);
          await instantScrolling(page);
          await installSentinels(page);
        };

        await ready();

        const environment = await readEnvironment(page);
        const cdp = await openAxSession(page);
        const budget = await walkBudget(page, SITE.grid);
        const findings: EvidenceFinding[] = [];
        const obscured = new Map<string, { visible: number; points: number }>();
        // A stop nobody can see is the keyboard check's finding (`focus-stop-hidden`); here only a stop that shows
        // somewhere is sampled for what covers it.
        const sample = (direction: string) => async(stop: SiteStop) => {
          const key = `${stop.shape}|${direction}`;

          if (stop.hidden !== null || stop.ariaHidden) {
            return;
          }

          if (!obscured.has(key) || obscured.get(key)!.visible > 0) {
            const points = await samplePoints(page);

            if (!obscured.has(key) || points.visible === 0) {
              obscured.set(key, points);
            }
          }
        };
        const problems: string[] = [];
        // A walk that ended short of the end is a problem, so the target does not read as measured; after one that
        // left the page, the page is opened again for what follows.
        const walk = async(direction: 'forward' | 'backward', step: string) => {
          const result = await tabWalk(page, cdp, SITE, { direction, budget, ax: false, onStop: sample(step) });
          const verdict = walkVerdict({ ...result, direction });
          const cutShort = walkProblem(verdict, budget);

          if (cutShort) {
            problems.push(`${step} walk: ${cutShort}`);
          }
          if (verdict === 'navigated') {
            await ready();
          }

          return result;
        };
        const forward = await walk('forward', 'Tab');

        await walk('backward', 'Shift+Tab');

        for (const [key, points] of obscured) {
          const [shape, step] = key.split('|');

          findings.push(...obscuredFindings({ selector: shape, step, ...points }) as EvidenceFinding[]);
        }

        const shapes = new Map<string, SiteStop>();

        for (const stop of forward.stops.filter(item => item.region === 'page' && item.hidden === null && !item.ariaHidden)) {
          if (!shapes.has(stop.shape) && shapes.size < SHAPES) {
            shapes.set(stop.shape, stop);
          }
        }

        const indicators = [];
        const boundaries = [];
        const names: string[] = [];

        for (const [shape, stop] of shapes) {
          const name = distinctName(shape, names);

          names.push(name);

          const measured = await indicator(page, stop);

          if (measured === null) {
            problems.push(`${name}: the focus could not be put back on it, or scrolling did not bring it into view, to measure its indicator`);
            continue;
          }
          indicators.push({ selector: name, ...measured.summary });
          findings.push(...focusFindings({ selector: name, step: 'Tab', change: measured.change }) as EvidenceFinding[]);
          if (FIELDS.test(shape)) {
            const boundary = measured.boundary;

            boundaries.push({ selector: name, ...boundary });
            findings.push(...boundaryFindings({ selector: name, ...boundary }) as EvidenceFinding[]);
          }
        }

        await attachEvidence(testInfo, {
          target, startedAt, environment, findings, problems, pageErrors,
          criteria: ['1.4.11', '2.4.7', '2.4.11'],
          detail: { budget, stops: forward.stops.length, obscured: Object.fromEntries(obscured), indicators, boundaries },
        });
      });
    }
  });
}
