import { readFileSync } from 'node:fs';
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { A11Y_PAGES, fixtureUrl, type A11yPage } from '../pages.mjs';
import { emulate, openTarget, reachState, releaseParkedFetches, type OpenedTarget } from '../harness';
import { attachEvidence, declareTarget, readEnvironment, type EvidenceFinding } from '../evidence';
import {
  cancellationFindings, DRAG_FIELDS, dragFindings, dragInventoryLines, gestureFindings, operationCriteria,
} from '../../lib/pointer.mjs';
import { DRAG_OPERATIONS, type DragOperation } from './drag-operations.mjs';
import { dragState, runSteps, settledState, type Step } from './drag-runner';
import { markTargets, pointerEffects, pointerState, settledPointerState, targetPoints, type PointerTarget } from './pointer-state';
import { installSentinels } from './walker';

/**
 * Pointer and drag alternatives: WCAG 2.5.1, 2.5.2 and 2.5.7, and 2.1.1 for every drag. A pointer works
 * the same on every theme, so the check runs on the main theme.
 *
 * - **Pointer cancellation** (2.5.2): on every page of the catalog in its state, every kind of control
 *   the grid and its portal draw is clicked once on a fresh page (the positive control: what the click
 *   does), then pressed on another fresh page with the pointer held, moved away from the grid and
 *   released. What the press did before the release, and what the release away did, are compared with
 *   the click (`cancellationFindings()` in `lib/pointer.mjs`).
 * - **Drag alternatives** (2.5.7, and 2.1.1 for the keyboard): every operation of `drag-operations.mjs` is
 *   dragged on a page as it loads, and the drag must have the effect the inventory names (the positive
 *   control; a drag that does not is a red test, because the inventory is wrong). Then each alternative
 *   runs on a page as it loads, and it is proven when it has the same effect and, for one that covers the
 *   whole drag, leaves the compared field as the drag left it. Every step but the last sets up; the state
 *   is read before and after the last. An alternative whose steps cannot run is not proven, and its cause
 *   is a tooling problem. A path-based or multipoint gesture is judged for 2.5.1 the same way; the
 *   inventory has none today.
 *
 * Report-only: a test fails for tooling only. Policy: `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

const THEME = 'main';

/**
 * Loads a catalog page in its state, ready for the pointer: the parked fetches released, the controls
 * marked.
 *
 * @param page The page.
 * @param entry The catalog entry.
 * @returns The opened target and its controls.
 */
async function fresh(page: Page, entry: A11yPage): Promise<{ opened: OpenedTarget; targets: PointerTarget[] }> {
  // Left on the last control, the pointer would hover the reloaded page (open a submenu or a comment)
  // before its controls are marked.
  await page.mouse.move(0, 0);

  const opened = await openTarget(page, entry, THEME);

  await reachState(page, entry, opened);
  await releaseParkedFetches(page);
  await installSentinels(page, opened.root);

  return { opened, targets: await markTargets(page, opened.root) };
}

/**
 * Where a control of the first load is on a reloaded page, or why it is not measured there. A mark is
 * the control's place in the order the page marked its controls, so a reload that marks one control
 * less, or one more, hands the id to another control: the click and the press would then land on a
 * control other than the one the finding names.
 *
 * @param page The page.
 * @param loaded The reloaded page and its controls.
 * @param control The control, as the first load marked it.
 * @returns Its points, or the reason it is not measured.
 */
async function locate(page: Page, loaded: { opened: OpenedTarget; targets: PointerTarget[] }, control: PointerTarget) {
  if (loaded.targets[control.id]?.selector !== control.selector) {
    return 'another control holds its mark after a reload';
  }

  const points = await targetPoints(page, loaded.opened.root, control.id);

  return points ?? 'not drawn after a reload';
}

/**
 * Measures pointer cancellation on one page: every control clicked, then pressed and released away.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param entry The catalog entry.
 */
async function cancellation(page: Page, testInfo: TestInfo, entry: A11yPage) {
  const startedAt = Date.now();
  const target = { page: entry.id, theme: THEME, state: entry.state, variant: 'pointer-cancellation', url: fixtureUrl(entry, THEME) };

  declareTarget(testInfo, target);

  const first = await fresh(page, entry);
  const environment = await readEnvironment(page);
  const findings: EvidenceFinding[] = [];
  const controls: Record<string, unknown>[] = [];
  // The harness feeds a page's errors to the list of its latest load only, so each load's list is
  // checked once its measurement is done, and the last load's goes to `attachEvidence()`.
  let latest = first.opened;

  for (const control of first.targets) {
    // The positive control: what a click does, on a page as it loads.
    const clickPage = control.id === 0 ? first : await fresh(page, entry);

    latest = clickPage.opened;

    const clickPoints = await locate(page, clickPage, control);

    if (typeof clickPoints === 'string') {
      controls.push({ ...control, measured: false, why: clickPoints });
      continue;
    }

    await page.mouse.move(clickPoints.at.x, clickPoints.at.y);

    const beforeClick = await settledPointerState(page, clickPage.opened.root);

    await page.mouse.click(clickPoints.at.x, clickPoints.at.y);

    const onClick = pointerEffects(beforeClick, await pointerState(page, clickPage.opened.root));

    expect(clickPage.opened.pageErrors, 'the page threw no error while it was clicked').toEqual([]);

    // The press, held, moved away from the grid and released, on a page as it loads.
    const pressPage = await fresh(page, entry);

    latest = pressPage.opened;

    const points = await locate(page, pressPage, control);

    if (typeof points === 'string' || !points.away) {
      controls.push({
        ...control, onClick, measured: false,
        why: typeof points === 'string' ? points : 'every corner of the viewport is on the grid or its portal, so no release is away from it',
      });
      continue;
    }

    await page.mouse.move(points.at.x, points.at.y);

    // What the hover alone does (a submenu opening on its timer) settles before the press is judged.
    const hovered = await settledPointerState(page, pressPage.opened.root);

    await page.mouse.down();

    const onPress = pointerEffects(hovered, await pointerState(page, pressPage.opened.root));

    await page.mouse.move(points.away.x, points.away.y, { steps: 4 });
    await page.mouse.up();

    const afterAway = pointerEffects(hovered, await pointerState(page, pressPage.opened.root));

    expect(pressPage.opened.pageErrors, 'the page threw no error while it was pressed and released').toEqual([]);

    const result = cancellationFindings({ target: control, onPress, afterAway, onClick });

    controls.push({ ...control, onClick, onPress, afterAway, measured: result.measured });
    findings.push(...result.findings);
  }

  await attachEvidence(testInfo, {
    target, startedAt, environment, findings, criteria: ['2.5.2'], pageErrors: latest.pageErrors,
    detail: { controls, measured: controls.filter(item => item.measured).length },
  });
}


/**
 * The page an operation runs on: its catalog page in its state, or its fixture as it loads.
 *
 * @param operation The operation.
 * @returns The page.
 */
function pageOf(operation: DragOperation): A11yPage {
  return A11Y_PAGES.find(item => item.id === operation.page)
    ?? { id: operation.id, fixture: operation.fixture!, query: operation.query, state: 'none', surface: operation.operation } as A11yPage;
}

/**
 * Loads the page an operation runs on, in its state, with the parked fetches released.
 *
 * @param page The page.
 * @param entry The page to load.
 * @returns The opened target.
 */
async function load(page: Page, entry: A11yPage): Promise<OpenedTarget> {
  const opened = await openTarget(page, entry, THEME);

  await reachState(page, entry, opened);
  await releaseParkedFetches(page);

  return opened;
}

/**
 * Runs steps on a page as it loaded: every step but the last sets up, and the state is read before and
 * after the last.
 *
 * @param page The page.
 * @param opened The loaded page (`load()`).
 * @param effect The effect the state is read until.
 * @param steps The steps.
 * @param prepare Steps that run before any of them.
 * @returns The effects of the last step and the state it left.
 */
async function perform(page: Page, opened: OpenedTarget, effect: string, steps: Step[], prepare: Step[] = []) {
  await runSteps(page, opened.root, [...prepare, ...steps.slice(0, -1)]);

  const before = await dragState(page, opened.root);

  await runSteps(page, opened.root, steps.slice(-1));

  const { after, effects } = await settledState(page, opened.root, before, effect);

  return { effects, before, after };
}

// Where each entry of the inventory starts, so a drag finding's annotation lands on it.
const DRAG_LINES = dragInventoryLines(readFileSync(new URL('./drag-operations.mjs', import.meta.url), 'utf8'));

/**
 * Performs one drag operation and each of its alternatives.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param operation The operation.
 */
async function dragOperation(page: Page, testInfo: TestInfo, operation: DragOperation) {
  const startedAt = Date.now();
  const entry = pageOf(operation);
  const target = { page: entry.id, theme: THEME, state: entry.state, variant: `drag-${operation.id}`, url: fixtureUrl(entry, THEME) };

  declareTarget(testInfo, target);

  const dragPage = await load(page, entry);
  const drag = await perform(page, dragPage, operation.expect, operation.drag);
  const environment = await readEnvironment(page);

  // The harness feeds a page's errors to the list of its latest load only, so each load's list is
  // checked once its steps are done, and the last load's goes to `attachEvidence()`.
  expect(dragPage.pageErrors, 'the page threw no error while it was dragged').toEqual([]);
  expect(drag.effects, `the drag (${operation.operation}) has the effect the inventory names`).toContain(operation.expect);
  expect(Object.keys(drag.after).sort(), 'DRAG_FIELDS of lib/pointer.mjs names every field of the drag state').toEqual([...DRAG_FIELDS].sort());

  const alternatives: Record<string, unknown>[] = [];
  const proven: boolean[] = [];
  const problems: string[] = [];
  let latest = dragPage;

  for (const [index, alternative] of operation.alternatives.entries()) {
    const described = { input: alternative.input, covers: alternative.covers, how: alternative.how };
    const opened = await load(page, entry);
    let result: Awaited<ReturnType<typeof perform>> | null = null;
    let cause = '';

    latest = opened;

    try {
      result = await perform(page, opened, operation.expect, alternative.steps, alternative.prepare);
    } catch (error) {
      // A step that cannot run (a menu item renamed, an F6 that no longer reaches the bar) or a read that
      // throws is the alternative not working, and the drag's own findings still stand.
      cause = String(error instanceof Error ? error.message : error).replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0];
    }

    // A page that threw is a target not measured (`attachEvidence()`), whichever step it threw in.
    expect(opened.pageErrors, `the page threw no error while alternative ${index + 1} ran`).toEqual([]);

    if (!result) {
      // The cause goes in the detail and in the problems, so a person tells a stale inventory from a
      // broken product.
      proven.push(false);
      alternatives.push({ ...described, proven: false, error: cause });
      problems.push(`${operation.id}: alternative ${index + 1} (${alternative.how}) did not run: ${cause}`);
      continue;
    }

    const same = alternative.covers !== 'full' || !operation.compare
      || JSON.stringify(result.after[operation.compare]) === JSON.stringify(drag.after[operation.compare]);
    const works = result.effects.includes(operation.expect) && same;

    proven.push(works);
    alternatives.push({ ...described, effects: result.effects, same, proven: works });
  }

  const line = DRAG_LINES.get(operation.id);
  const findings: EvidenceFinding[] = [...dragFindings({ operation, proven, line }), ...gestureFindings({ operation, proven, line })];

  await attachEvidence(testInfo, {
    target, startedAt, environment, findings, problems, pageErrors: latest.pageErrors, criteria: operationCriteria(operation),
    detail: { operation: operation.id, plugin: operation.plugin, gesture: operation.gesture, what: operation.operation, drag: drag.effects, alternatives },
  });
}

for (const operation of DRAG_OPERATIONS) {
  const title = `drag alternatives of ${operation.id}`;
  const body = ({ page }: { page: Page }, testInfo: TestInfo) => dragOperation(page, testInfo, operation);
  const device = pageOf(operation).device;

  if (device) {
    test.describe(() => {
      test.use(emulate(device));
      test(title, body);
    });
  } else {
    test(title, body);
  }
}

for (const entry of A11Y_PAGES) {
  const title = `pointer cancellation on ${entry.id}`;
  const body = ({ page }: { page: Page }, testInfo: TestInfo) => cancellation(page, testInfo, entry);

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
