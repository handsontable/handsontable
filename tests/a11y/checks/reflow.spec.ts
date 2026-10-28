import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { A11Y_PAGES, fixtureUrl, type A11yPage } from '../pages.mjs';
import { PORTAL_MARK, openTarget, reachState, releaseParkedFetches, selectCell } from '../harness';
import { attachEvidence, declareTarget, readEnvironment, type EvidenceFinding } from '../evidence';
import { A11Y_THEMES } from '../../lib/a11y-baseline.mjs';
import {
  CONDITIONS,
  TEXT_SPACING_CSS,
  clippingFindings,
  hoverFindings,
  orientationFindings,
  overlapFindings,
  viewportFindings,
} from '../../lib/reflow.mjs';

/**
 * Zoom, reflow, text spacing and hover content: WCAG 1.3.4, 1.4.4, 1.4.10, 1.4.12 and 1.4.13 on every
 * theme.
 *
 * - **The conditions** (`CONDITIONS` in `lib/reflow.mjs`): 320 CSS px wide (1.4.10), 200% zoom as a
 *   640 px window (1.4.4), and the WCAG text-spacing override injected before the grid is built
 *   (1.4.12). Under each, the surfaces around the grid (menus, editor lists, dialogs, notifications, the
 *   bars, the comment editor, the overlays) are measured for text a clipping container cuts off, surfaces
 *   the viewport cuts off or that make the page scroll sideways, and controls drawn over each other. The
 *   grid body is exempt: a data grid may scroll in two dimensions.
 * - **Hover content** (1.4.13): a commented cell is hovered, and its comment must be dismissible with
 *   Escape, hoverable, and persistent (a fake clock runs ten seconds while the pointer rests on it).
 * - **Orientation** (1.3.4): the grid shows in a portrait and in a landscape viewport.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

// The pages whose surfaces reflow: every popup and bar of the catalog, and the plain grid.
const PAGES = ['grid', 'context-menu', 'context-menu-submenu', 'dropdown-menu', 'filters-conditions', 'autocomplete-editor', 'multiselect-editor',
  'comments', 'dialog', 'notification', 'pagination', 'sheets-bar', 'data-provider-sheets-bar', 'license-bar', 'empty-data', 'loading'];
const ORIENTATION_PAGES = ['grid', 'pagination', 'sheets-bar'];
// The surfaces around the grid, by the class that marks each, and whether it is a popup (a menu, a list,
// a dialog) or a part of the page's flow (a bar). Whether a surface is positioned against the viewport is
// read from its computed style, because that decides whether the page can scroll to it.
const SURFACES: Array<[string, string, boolean]> = [
  ['.htMenu', 'menu', true],
  ['.handsontableEditor, .autocompleteEditor, .ht-multi-select-editor', 'editor list', true],
  ['.htComments', 'comment editor', true],
  ['.ht-dialog', 'dialog', true],
  ['.ht-notification', 'notification', true],
  ['.ht-pagination', 'pagination', false],
  ['.ht-sheets-bar', 'sheets bar', false],
  ['.ht-empty-data-state', 'empty-data message', false],
  ['[class*="ht-license"]', 'license bar', false],
];

/**
 * Injects the text-spacing override as soon as the document has a head, before the fixture builds its
 * grid, the way a user's stylesheet or bookmarklet would be in place when the page draws.
 *
 * @param page The page.
 */
async function installTextSpacing(page: Page): Promise<void> {
  await page.addInitScript((css) => {
    const insert = () => {
      const style = document.createElement('style');

      style.dataset.a11yTextSpacing = '';
      style.textContent = css;
      document.head.append(style);
    };

    if (document.head) {
      insert();
    } else {
      new MutationObserver((_records, observer) => {
        if (document.head) {
          observer.disconnect();
          insert();
        }
      }).observe(document, { childList: true, subtree: true });
    }
  }, TEXT_SPACING_CSS);
}

/**
 * Measures the surfaces around the grid in one evaluation: the clipping containers holding text, the
 * surfaces' boxes, the controls' boxes, and the viewport with the page's scroll size.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns What was measured.
 */
async function collect(page: Page, root: string) {
  return page.evaluate(([selector, portalMark, surfaces]) => {
    const container = document.querySelector(selector)!;
    // Every marked portal: a state whose popups mount in a portal of their own marks that one too.
    const scopes = [container, ...document.querySelectorAll(`[${portalMark}]`)].filter((node): node is Element => !!node);
    const inGridBody = (node: Element) => container.contains(node) && !!node.closest('.ht_master, [class*="ht_clone_"]')
      && !node.closest(surfaces.map(([css]) => css).join(', '));
    const surfaceOf = (node: Element) => surfaces.find(([css]) => node.closest(css))?.[1] ?? 'grid UI';
    // A closed cell editor stays in the DOM, parked under a cell (`ht_editor_hidden`): it is not on screen.
    const visible = (node: Element) => {
      const rect = node.getBoundingClientRect();

      return rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== 'hidden' && !node.closest('.ht_editor_hidden');
    };
    const name = (node: Element) => {
      const classes = [...node.classList].filter(item => !/^(current|area|highlight|ht_[0-9a-f]+)$/.test(item)).slice(0, 1);
      const label = node.getAttribute('aria-label') ?? node.textContent?.trim().slice(0, 24) ?? '';

      return `${node.tagName.toLowerCase()}${classes.map(item => `.${item}`).join('')}${label ? ` "${label}"` : ''}`;
    };
    const elements = scopes.flatMap(scope => [scope, ...scope.querySelectorAll('*')]).filter(node => !inGridBody(node) && visible(node));
    const boxes = elements.filter((node) => {
      const style = getComputedStyle(node);
      const clips = ['hidden', 'clip'];

      return (clips.includes(style.overflowX) && node.scrollWidth > node.clientWidth + 1)
        || (clips.includes(style.overflowY) && node.scrollHeight > node.clientHeight + 1);
    }).filter(node => (node.textContent ?? '').trim() !== '').map((node) => {
      const style = getComputedStyle(node);

      return {
        selector: name(node), surface: surfaceOf(node), text: (node.textContent ?? '').trim().slice(0, 80),
        overflowX: style.overflowX, overflowY: style.overflowY, ellipsis: style.textOverflow === 'ellipsis',
        scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight,
      };
    });
    const surfaceBoxes = surfaces.flatMap(([css, label, popup]) => scopes.flatMap(scope => [...scope.querySelectorAll(css)])
      .filter(node => visible(node) && !node.parentElement?.closest(css))
      .map((node) => {
        const rect = node.getBoundingClientRect();
        let fixed = false;

        for (let at: Element | null = node; at && !fixed; at = at.parentElement) {
          fixed = getComputedStyle(at).position === 'fixed';
        }

        return { selector: name(node).split(' "')[0], surface: label, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, fixed, popup };
      }));
    const interactive = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"], [role="menuitem"], '
      + '[role="menuitemcheckbox"], [role="option"], [role="checkbox"]';
    // The part of a box its scrolling and clipping ancestors leave on screen: a checkbox scrolled out of a
    // list's viewport still reports its full box, and would read as lying over the controls below the list.
    const shown = (node: Element) => {
      const rect = node.getBoundingClientRect();
      let [left, top, right, bottom] = [rect.left, rect.top, rect.right, rect.bottom];

      for (let at = node.parentElement; at; at = at.parentElement) {
        const style = getComputedStyle(at);

        if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
          const clip = at.getBoundingClientRect();

          [left, top, right, bottom] = [Math.max(left, clip.left), Math.max(top, clip.top), Math.min(right, clip.right), Math.min(bottom, clip.bottom)];
        }
      }

      return { left, top, right: Math.max(left, right), bottom: Math.max(top, bottom) };
    };
    const interactiveElements = elements.filter(node => node.matches(interactive));
    const controls = interactiveElements.map((node, id) => {
      const rect = shown(node);
      const within = interactiveElements.map((other, index) => (other !== node && other.contains(node) ? index : -1)).filter(index => index > -1);

      return { id, selector: name(node), left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, within };
    });

    return {
      boxes,
      surfaces: surfaceBoxes,
      controls,
      viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
    };
  }, [root, PORTAL_MARK, SURFACES] as const);
}

/**
 * Measures one page under one condition.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param entry The catalog entry.
 * @param theme The theme.
 * @param condition The condition.
 */
async function measure(page: Page, testInfo: TestInfo, entry: A11yPage, theme: string, condition: keyof typeof CONDITIONS) {
  const startedAt = Date.now();
  const target = { page: entry.id, theme, state: entry.state, variant: condition, url: fixtureUrl(entry, theme) };

  declareTarget(testInfo, target);
  if (condition === 'text-spacing') {
    await installTextSpacing(page);
  }

  const opened = await openTarget(page, entry, theme);

  await reachState(page, entry, opened);
  await releaseParkedFetches(page);

  const environment = await readEnvironment(page);
  const { measured, settled } = await collectSettled(page, opened.root);
  const findings: EvidenceFinding[] = [
    ...clippingFindings({ condition, boxes: measured.boxes }),
    ...viewportFindings({ condition, viewport: measured.viewport, surfaces: measured.surfaces }),
    ...overlapFindings({ condition, controls: measured.controls }),
  ];

  await attachEvidence(testInfo, {
    target, startedAt, environment, findings, criteria: CONDITIONS[condition].criteria,
    detail: { settled, viewport: measured.viewport, surfaces: measured.surfaces, clippingContainers: measured.boxes, controls: measured.controls.length },
  });
}

/**
 * Measures until two measurements three frames apart agree, so a bar still updating after its data
 * arrived (the data-provider page releases a parked fetch) is measured once it has settled. Five tries at
 * most; the last measurement is kept either way, and `settled` says whether it was stable.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The measurement and whether it settled.
 */
async function collectSettled(page: Page, root: string) {
  const frames = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  let previous = await collect(page, root);

  for (let attempt = 0; attempt < 5; attempt++) {
    await frames();

    const current = await collect(page, root);

    if (JSON.stringify(current) === JSON.stringify(previous)) {
      return { measured: current, settled: true };
    }
    previous = current;
  }

  return { measured: previous, settled: false };
}

/**
 * Hovers a commented cell and checks its comment for 1.4.13: it appears, stays while the pointer moves
 * onto it, stays while the pointer rests on it (a fake clock runs ten seconds), and Escape hides it.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param theme The theme.
 */
async function hover(page: Page, testInfo: TestInfo, theme: string) {
  const startedAt = Date.now();
  const entry = { ...A11Y_PAGES.find(item => item.id === 'comments')!, state: 'none' as const };
  const target = { page: entry.id, theme, state: 'hover', variant: 'hover', url: fixtureUrl(entry, theme) };

  declareTarget(testInfo, target);

  const opened = await openTarget(page, entry, theme);

  await reachState(page, entry, opened);
  // The grid listens, as it would for a user who has worked in it, so Escape reaches it.
  await selectCell(page, opened.root, [5, 3]);

  const environment = await readEnvironment(page);
  const comment = page.locator('.htComments');
  const cell = page.locator(`${opened.root} .ht_master`).getByTestId('cell-1-1');

  await cell.hover();

  let appeared = true;

  try {
    await expect(comment).toBeVisible({ timeout: 3000 });
  } catch {
    appeared = false;
  }

  const result = { appeared, hoverable: false, persistent: false, dismissible: false };

  if (appeared) {
    // The comment's own timers run on a fake clock from here, so "stays" means after the time its hide
    // timers take, not after an arbitrary wait.
    await page.clock.install();

    const box = (await comment.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    await page.clock.runFor(1000);
    result.hoverable = await comment.isVisible();
    await page.clock.runFor(10_000);
    result.persistent = await comment.isVisible();
    await page.keyboard.press('Escape');
    await page.clock.runFor(1000);
    result.dismissible = !(await comment.isVisible());
  }

  await attachEvidence(testInfo, {
    target, startedAt, environment, criteria: ['1.4.13'],
    findings: hoverFindings({ selector: '.htComments', ...result }),
    detail: result,
  });
}

/**
 * Loads a page in a portrait and in a landscape viewport and checks that the grid shows in both.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param entry The catalog entry.
 * @param theme The theme.
 */
async function orientation(page: Page, testInfo: TestInfo, entry: A11yPage, theme: string) {
  const startedAt = Date.now();
  const target = { page: entry.id, theme, state: entry.state, variant: 'orientation', url: fixtureUrl(entry, theme) };

  declareTarget(testInfo, target);

  const sizes: Record<string, { width: number; height: number }> = {};
  let environment = null;

  for (const [name, viewport] of [['portrait', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]] as const) {
    await page.setViewportSize(viewport);

    const opened = await openTarget(page, entry, theme);

    await reachState(page, entry, opened);
    environment ??= await readEnvironment(page);
    sizes[name] = await page.evaluate((selector) => {
      const rect = document.querySelector(selector)!.querySelector('.ht-root-wrapper')!.getBoundingClientRect();
      const width = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
      const height = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));

      return { width, height };
    }, opened.root);
  }

  await attachEvidence(testInfo, {
    target, startedAt, environment: environment!, criteria: ['1.3.4'],
    findings: orientationFindings(sizes as { portrait: { width: number; height: number }; landscape: { width: number; height: number } }),
    detail: sizes,
  });
}

for (const theme of A11Y_THEMES) {
  for (const condition of Object.keys(CONDITIONS) as Array<keyof typeof CONDITIONS>) {
    test.describe(() => {
      test.use({ viewport: CONDITIONS[condition].viewport });
      for (const id of PAGES) {
        const entry = A11Y_PAGES.find(item => item.id === id)!;

        test(`${condition} ${id} on ${theme}`, ({ page }, testInfo) => measure(page, testInfo, entry, theme, condition));
      }
    });
  }
  test(`hover content on ${theme}`, ({ page }, testInfo) => hover(page, testInfo, theme));
  for (const id of ORIENTATION_PAGES) {
    const entry = A11Y_PAGES.find(item => item.id === id)!;

    test(`orientation ${id} on ${theme}`, ({ page }, testInfo) => orientation(page, testInfo, entry, theme));
  }
}
