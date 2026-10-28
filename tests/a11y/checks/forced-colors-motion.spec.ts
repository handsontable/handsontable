import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { A11Y_PAGES, fixtureUrl, type A11yPage } from '../pages.mjs';
import { emulate, openTarget, reachState, releaseParkedFetches, selectCell, type OpenedTarget } from '../harness';
import { attachEvidence, declareTarget, readEnvironment, type EvidenceFinding } from '../evidence';
import { A11Y_THEMES } from '../../lib/a11y-baseline.mjs';
import { dominantColor, indicatorChange, isDrawn, strongestPixel } from '../../lib/contrast.mjs';
import { forcedColorsFindings, isMotion, longRunningFindings, motionFindings } from '../../lib/motion.mjs';
import { capture, cellBox, grow, settle, type Image } from './pixels';

/**
 * Forced colors and reduced motion: WCAG 2.2.2, 2.3.3, and the forced-colors support of 1.4.1, 1.4.11
 * and 2.4.7, on every theme. Nightly only: watching every state for five seconds is minutes of work.
 *
 * - **Reduced motion, at rest** (2.2.2, 2.3.3): every page of the catalog in its state, with
 *   `prefers-reduced-motion: reduce`, watched for five seconds frame by frame through
 *   `document.getAnimations()`. A motion animation still running is `motion-despite-reduced-motion`; an
 *   animation that moves or blinks for the whole window is `moves-over-five-seconds`.
 * - **Reduced motion, on interaction** (2.3.3): a sheet switch, a dialog shown, a notification shown and a
 *   menu opened, watched for 1.5 seconds each, with the preference and without it. Without it is the
 *   positive control: an interaction that animates there, and not under the preference, proves the watch
 *   sees motion and the grid honors the preference.
 * - **Forced colors** (`forcedColors: 'active'`): the cell focus, a selected range, a menu's highlight,
 *   the grid lines and the icons, each captured (attached as a PNG) and required to stay visible.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

const WATCH_MS = 5000;
const INTERACTION_MS = 1500;

interface SeenAnimation {
  kind: string;
  name: string;
  properties: string[];
  duration: number;
  iterations: number;
  target: string;
  firstSeen: number;
  lastSeen: number;
  running: boolean;
}

/**
 * Watches `document.getAnimations()` on every frame for a time and records each animation seen running:
 * its kind, its name (the animation name or the transitioned property), the properties it animates, its
 * duration and iterations, its target, and when it was first and last seen running.
 *
 * @param page The page.
 * @param ms How long to watch.
 * @returns The animations.
 */
async function watchAnimations(page: Page, ms: number): Promise<SeenAnimation[]> {
  const seen = await page.evaluate(async(duration) => {
    const start = performance.now();
    const records = new Map<Animation, Record<string, unknown>>();
    const kebab = (name: string) => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const describe = (animation: Animation) => {
      const effect = animation.effect as KeyframeEffect | null;
      const target = effect?.target as Element | null;
      const css = animation as Animation & { animationName?: string; transitionProperty?: string };
      const keyframes = effect?.getKeyframes?.() ?? [];
      const properties = css.transitionProperty
        ? [css.transitionProperty]
        : [...new Set(keyframes.flatMap(frame => Object.keys(frame).filter(key => !['offset', 'computedOffset', 'easing', 'composite'].includes(key))))].map(kebab);
      const timing = effect?.getComputedTiming?.() ?? {};
      const classes = target ? [...target.classList].slice(0, 1).map(name => `.${name}`).join('') : '';

      return {
        kind: animation.constructor.name,
        name: css.animationName ?? css.transitionProperty ?? animation.id ?? 'animation',
        properties,
        duration: Number(timing.duration) || 0,
        iterations: timing.iterations === Infinity ? 'Infinity' : Number(timing.iterations ?? 1),
        target: target ? `${target.tagName.toLowerCase()}${classes}` : 'none',
      };
    };

    await new Promise<void>((resolve) => {
      const tick = () => {
        const now = performance.now() - start;

        for (const animation of document.getAnimations()) {
          if (animation.playState === 'running') {
            const record = records.get(animation) ?? { ...describe(animation), firstSeen: now };

            record.lastSeen = now;
            records.set(animation, record);
          }
        }
        if (now >= duration) {
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    });

    return [...records].map(([animation, record]) => ({ ...record, running: animation.playState === 'running' }));
  }, ms);

  return seen.map(item => ({ ...item, iterations: item.iterations === 'Infinity' ? Infinity : Number(item.iterations) }) as SeenAnimation);
}

/**
 * Watches every catalog state at rest for five seconds with the reduced-motion preference.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param entry The catalog entry.
 * @param theme The theme.
 */
async function watchState(page: Page, testInfo: TestInfo, entry: A11yPage, theme: string) {
  const startedAt = Date.now();
  const target = { page: entry.id, theme, state: entry.state, variant: 'reduced-motion', url: fixtureUrl(entry, theme) };

  declareTarget(testInfo, target);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const opened = await openTarget(page, entry, theme);

  await reachState(page, entry, opened);
  await releaseParkedFetches(page);

  const environment = await readEnvironment(page);
  const animations = await watchAnimations(page, WATCH_MS);
  const findings = [
    ...motionFindings({ reducedMotion: true, step: `the ${entry.state} state, watched for five seconds`, animations: animations.filter(item => item.running) }),
    ...longRunningFindings({ windowMs: WATCH_MS, animations }),
  ];

  await attachEvidence(testInfo, {
    target, startedAt, environment, findings, criteria: ['2.2.2', '2.3.3'], detail: { animations }, pageErrors: opened.pageErrors,
  });
}

type Interaction = { page: string; label: string; query?: string; act: (page: Page, opened: OpenedTarget) => Promise<void> };

const hotOf = (selector: string) => `(document.querySelector(${JSON.stringify(selector)})?.querySelector('.ht-root-wrapper'))?.__hotInstance`;

// The interactions the themes animate. The positive control is the same interaction without the preference.
// The dialog and notification fixtures turn their animation off so their states are reached at once, so
// these turn it back on: the dialog through its `animation` setting, the notification through `?animation=1`.
const INTERACTIONS: Interaction[] = [
  {
    page: 'sheets-bar',
    label: 'switch to the second sheet',
    act: async(page, opened) => {
      await page.locator(`${opened.root} .ht-sheets-bar__tab`).nth(1).click();
    },
  },
  {
    page: 'dialog',
    label: 'show the dialog again',
    act: async(page, opened) => {
      await page.evaluate(`(() => {
        const hot = ${hotOf(opened.root)};
        const dialog = hot.getPlugin('dialog');

        dialog.hide();
        hot.updateSettings({ dialog: { ...hot.getSettings().dialog, animation: true } });
        dialog.show();
      })()`);
    },
  },
  {
    page: 'notification',
    label: 'show a notification',
    query: 'animation=1',
    act: async(page, opened) => {
      await page.evaluate(`${hotOf(opened.root)}.getPlugin('notification').showMessage({ title: 'Saved', message: 'The change was saved.' })`);
    },
  },
  {
    page: 'grid',
    label: 'open the context menu',
    act: async(page, opened) => {
      await selectCell(page, opened.root, [1, 1]);
      await page.keyboard.press('Shift+F10');
    },
  },
];

/**
 * Runs one interaction with the preference and without it, and watches what it animates.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param interaction The interaction.
 * @param theme The theme.
 * @param reducedMotion Whether the page is told the user prefers reduced motion.
 */
async function interact(page: Page, testInfo: TestInfo, interaction: Interaction, theme: string, reducedMotion: boolean) {
  const startedAt = Date.now();
  const entry = A11Y_PAGES.find(item => item.id === interaction.page)!;
  // Not `reduced-motion`: the same page is watched at rest under that variant, and a target is keyed by it.
  const variant = reducedMotion ? 'interaction-reduced-motion' : 'interaction-motion-allowed';
  const url = `${fixtureUrl(entry, theme)}${interaction.query ? `&${interaction.query}` : ''}`;
  const target = { page: entry.id, theme, state: entry.state, variant, url };

  declareTarget(testInfo, target);
  await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });

  const opened = await openTarget(page, entry, theme, { url });

  await reachState(page, entry, opened);
  await releaseParkedFetches(page);
  // Let what the load started finish, so the watch sees what the interaction starts.
  await settle(page);

  const environment = await readEnvironment(page);
  const watching = watchAnimations(page, INTERACTION_MS);

  await interaction.act(page, opened);

  const animations = await watching;
  const motion = animations.filter(isMotion);

  await attachEvidence(testInfo, {
    target, startedAt, environment, criteria: ['2.3.3'],
    findings: motionFindings({ reducedMotion, step: interaction.label, animations }),
    detail: { interaction: interaction.label, reducedMotion, animations, motion: motion.length },
    pageErrors: opened.pageErrors,
  });
}

/**
 * Captures a state in forced colors and attaches the capture.
 *
 * @param testInfo The running test.
 * @param name The capture's name.
 * @param image The capture.
 */
async function keep(testInfo: TestInfo, name: string, image: Image): Promise<void> {
  if (image.png) {
    await testInfo.attach(`forced-colors-${name}`, { body: image.png, contentType: 'image/png' });
  }
}

/**
 * Measures the grid's states in forced colors: the cell focus, a selected range, the grid lines, a menu's
 * highlight and the icons, each required to stay visible.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param theme The theme.
 */
async function forcedColors(page: Page, testInfo: TestInfo, theme: string) {
  const startedAt = Date.now();
  const entry = A11Y_PAGES.find(item => item.id === 'shared-demo')!;
  const target = { page: entry.id, theme, state: entry.state, variant: 'forced-colors', url: fixtureUrl(entry, theme) };

  declareTarget(testInfo, target);
  await page.emulateMedia({ forcedColors: 'active' });

  const opened = await openTarget(page, entry, theme);
  const { root } = opened;

  await reachState(page, entry, opened);
  await page.mouse.move(0, 0);

  const environment = await readEnvironment(page);
  const findings: EvidenceFinding[] = [];
  const detail: Record<string, unknown> = {};

  // The cell focus: (1, 2) before and after ArrowRight from (1, 1).
  await selectCell(page, root, [1, 1]);
  await settle(page);

  const focusBox = await cellBox(page, root, 1, 2);

  if (focusBox) {
    const before = await capture(page, grow(focusBox));

    await page.keyboard.press('ArrowRight');
    await settle(page);

    const after = await capture(page, grow(focusBox));
    const change = indicatorChange(before, after);

    await keep(testInfo, 'cell-focus', after);
    detail.focus = { changed: change.changed };
    findings.push(...forcedColorsFindings({ part: 'focus', selector: 'td (a focused cell)', step: 'ArrowRight from (1, 1)', changed: change.changed }));
  }

  // A selected range: a strip across its bottom edge, before and after.
  await page.evaluate(`${hotOf(root)}.deselectCell()`);
  await settle(page);

  const first = await cellBox(page, root, 3, 1);
  const last = await cellBox(page, root, 4, 2);

  if (first && last) {
    const strip = { x: first.x + 8, y: last.y + last.height - 4, width: last.x + last.width - first.x - 16, height: 8 };
    const before = await capture(page, strip);

    await page.evaluate(`${hotOf(root)}.selectCells([[3, 1, 4, 2]])`);
    await settle(page);

    const after = await capture(page, strip);
    const change = indicatorChange(before, after);

    await keep(testInfo, 'selection', after);
    detail.selection = { changed: change.changed };
    findings.push(...forcedColorsFindings({ part: 'selection', selector: '.wtBorder.area', step: 'select (3, 1) to (4, 2)', changed: change.changed }));
  }

  // The grid lines: a strip across the border between two cells.
  await page.evaluate(`${hotOf(root)}.deselectCell()`);
  await settle(page);

  const cell = await cellBox(page, root, 6, 1);

  if (cell) {
    const image = await capture(page, { x: cell.x + cell.width - 3, y: cell.y + 2, width: 6, height: Math.max(4, cell.height - 4) });
    const line = strongestPixel(image, dominantColor(image));

    await keep(testInfo, 'gridlines', image);
    detail.gridlines = { ratio: line.ratio };
    findings.push(...forcedColorsFindings({ part: 'gridlines', selector: 'td (the border between two cells)', step: 'at rest', changed: isDrawn(line) ? 1 : 0 }));
  }

  // The column menu button icons in the headers.
  const icons = await page.evaluate((selector) => [...document.querySelectorAll(`${selector} .ht_clone_top .changeType`)].slice(0, 2).map((node) => {
    const rect = node.getBoundingClientRect();

    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }).filter(box => box.width > 2), root);

  for (const [index, box] of icons.entries()) {
    const image = await capture(page, grow(box, 2));
    const part = strongestPixel(image, dominantColor(image));

    await keep(testInfo, `icon-${index}`, image);
    findings.push(...forcedColorsFindings({ part: 'icon', selector: '.changeType', step: 'at rest', changed: isDrawn(part) ? 1 : 0 }));
  }
  detail.icons = icons.length;

  // A menu's highlight: the item ArrowDown moves onto, before and after.
  await selectCell(page, root, [1, 1]);
  await page.keyboard.press('Shift+F10');
  await expect(page.locator('.htContextMenu .ht_master .htCore tbody td').first()).toBeVisible();

  const itemBox = await page.evaluate(() => {
    const menu = [...document.querySelectorAll('.htContextMenu')].find(node => node.getBoundingClientRect().width > 0);
    const cells = [...(menu?.querySelectorAll('.ht_master .htCore tbody td') ?? [])].filter(td => !td.classList.contains('htSeparator'));
    const current = cells.findIndex(td => td.classList.contains('current'));
    const rect = (cells[current + 1] ?? cells[1])?.getBoundingClientRect();

    return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
  });

  if (itemBox) {
    const before = await capture(page, itemBox);

    await page.keyboard.press('ArrowDown');
    await settle(page);

    const after = await capture(page, itemBox);
    const change = indicatorChange(before, after);

    await keep(testInfo, 'menu-highlight', after);
    detail.menu = { changed: change.changed };
    findings.push(...forcedColorsFindings({ part: 'menu', selector: 'td (a menu item)', step: 'ArrowDown in the context menu', changed: change.changed }));
  }

  await attachEvidence(testInfo, { target, startedAt, environment, findings, criteria: ['1.4.1'], detail, pageErrors: opened.pageErrors });
}

for (const theme of A11Y_THEMES) {
  test(`forced colors on ${theme}`, ({ page }, testInfo) => forcedColors(page, testInfo, theme));
  for (const interaction of INTERACTIONS) {
    for (const reducedMotion of [true, false]) {
      test(`${interaction.label} on ${theme}${reducedMotion ? ' (reduced motion)' : ' (motion allowed)'}`,
        ({ page }, testInfo) => interact(page, testInfo, interaction, theme, reducedMotion));
    }
  }
  for (const entry of A11Y_PAGES) {
    const title = `watch ${entry.id} on ${theme}`;
    const body = ({ page }: { page: Page }, testInfo: TestInfo) => watchState(page, testInfo, entry, theme);

    if (entry.device) {
      const device = entry.device;

      test.describe(() => {
        test.use(emulate(device));
        test(title, body);
      });
    } else {
      test(title, body);
    }
  }
}
