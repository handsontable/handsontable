import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { test, expect, type CDPSession, type Page, type TestInfo } from '@playwright/test';
import { A11Y_PAGES, fixtureUrl, type A11yPage } from '../pages.mjs';
import { PORTAL_MARK, STATES, emulate, openTarget, reachState, releaseParkedFetches, type OpenedTarget } from '../harness';
import { attachEvidence, declareTarget, readEnvironment, type EvidenceFinding } from '../evidence';
import {
  diffTabOrder,
  escapeFindings,
  goldenStops,
  inventoryLines,
  parseShortcutTables,
  probeVerdict,
  shortcutKey,
  singleCharacterShortcuts,
  walkFindings,
  walkVerdict,
} from '../../lib/keyboard-walker.mjs';
import { SHORTCUT_PROBES } from './keyboard-shortcuts.mjs';
import {
  installSentinels,
  openAxSession,
  readStop,
  runApiStep,
  selectThrough,
  snapshot,
  tabWalk,
  type FocusStop,
  type GridSnapshot,
} from './walker';

/**
 * The keyboard walker: WCAG 2.1.1, 2.1.2, 2.1.4, 2.4.3, 3.2.1 and 3.2.2, measured with the keyboard on
 * every page of the catalog (`../pages.mjs`), in its state, on the main theme (a theme is CSS: it
 * changes no tab stop and no key).
 *
 * - **Tab walks.** A sentinel goes right before and right after the grid's root container, and the walk
 *   presses Tab from the first until the focus reaches the second (Shift+Tab the other way), recording
 *   every stop: its region, its accessible role and name (Chromium's accessibility tree, over CDP),
 *   the cell it is on. A walk that never gets out is a trap (2.1.2), unless a modal dialog holds the
 *   focus and Escape or a button lets it out. A stop with no role or no name is a 4.1.2 finding, a
 *   press that opened something is a change of context on focus (3.2.1). The forward walk is compared
 *   with its golden under `../tab-order-goldens/`, advisory (2.4.3).
 * - **Popups.** On a menu, an editor or the comment editor, Escape must close the popup and give the
 *   focus back to the cell it opened on (2.1.2, 2.4.3), and the stops Tab reaches inside it are
 *   recorded and judged the same way.
 * - **The APG grid keys** on every grid at rest: arrows, Home, End, Page Up, Page Down, Ctrl+Home, Enter,
 *   F2, Escape. Where each landed is recorded; a key that moves the focus out of the grid is a finding,
 *   one that does nothing is advisory (an edge cell can legitimately stay put).
 * - **Input.** Every form control a walk stopped on gets an input (Space, ArrowDown, a typed letter), and
 *   the input must not change the context (3.2.2).
 * - **The documented shortcuts.** Every row of the keyboard shortcuts guide is pressed where
 *   `keyboard-shortcuts.mjs` says, and must do what the guide says (2.1.1): nothing at all is a
 *   finding, the focus leaving the grid is one (2.4.3), another effect is advisory. With the focus
 *   outside the grid, printable keys must change nothing (2.1.4).
 *
 * Report-only: a test fails for tooling only (a page that does not load, a state the keyboard did not
 * reach). `HOT_A11Y_UPDATE_GOLDENS=1` records the tab-order goldens instead of comparing them. Policy:
 * `tests/AGENTS.md`, "A11y: the checks beyond axe".
 */

const THEME = 'main';
const GOLDENS = new URL('../tab-order-goldens/', import.meta.url);
const UPDATE_GOLDENS = process.env.HOT_A11Y_UPDATE_GOLDENS === '1';
const INVENTORY_FILE = 'tests/a11y/checks/keyboard-shortcuts.mjs';
const INVENTORY_LINES = inventoryLines(readFileSync(new URL('./keyboard-shortcuts.mjs', import.meta.url), 'utf8'));
const DOCS_ROWS = parseShortcutTables(readFileSync(new URL('../../../docs/content/guides/navigation/keyboard-shortcuts/keyboard-shortcuts.md', import.meta.url), 'utf8'));
const WALK_CRITERIA = ['2.1.1', '2.1.2', '2.4.3', '3.2.1', '3.2.2'];
const POPUP_STATES = new Set(['context-menu', 'context-menu-submenu', 'dropdown-menu', 'editor', 'comment', 'formula-suggestions', 'formula-function-help']);
const REST_STATES = new Set(['none', 'selection', 'data-provider']);
// A popup the keyboard enters with a key of its own once the state has opened it: the formula function help
// takes the focus on F6, while Tab commits the edit instead of entering it.
const POPUP_ENTRY: Record<string, string> = { 'formula-function-help': 'F6' };
// The probe page of the documented shortcuts: one grid with the plugins most rows need.
const SHORTCUTS_PAGE: A11yPage = {
  id: 'keyboard-shortcuts', fixture: 'keyboard-shortcuts.html', state: 'none',
  surface: 'the keyboard walker\'s probe grid: menus, filters, comments, merging, undo, clipboard, sorting, navigable headers',
};
// The APG grid keys pressed on every grid at rest, each from the same cell.
// `edge` names the edge the key cannot move past from the start cell, where staying put is right.
const GRID_KEYS: Array<{ key: string; expect: string; edit?: boolean; prepare?: string; edge?: string }> = [
  { key: 'ArrowDown', expect: 'selection-moves', edge: 'bottom' },
  { key: 'ArrowUp', expect: 'selection-moves', edge: 'top' },
  { key: 'ArrowRight', expect: 'selection-moves', edge: 'right' },
  { key: 'ArrowLeft', expect: 'selection-moves', edge: 'left' },
  { key: 'Home', expect: 'selection-moves', edge: 'start' },
  { key: 'End', expect: 'selection-moves', edge: 'end' },
  { key: 'PageDown', expect: 'selection-moves', edge: 'bottom' },
  { key: 'PageUp', expect: 'selection-moves', edge: 'top' },
  { key: 'ControlOrMeta+Home', expect: 'selection-moves', edge: 'origin' },
  { key: 'Enter', expect: 'editor-opens', edit: true },
  { key: 'F2', expect: 'editor-opens', edit: true },
  { key: 'Escape', expect: 'editor-closes', edit: true, prepare: 'Enter' },
];

/**
 * The page's root container when its grid can be navigated: rows and columns to move in, no overlay
 * covering the cells, no modal dialog open.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns What the grid allows.
 */
async function gridState(page: Page, root: string) {
  return page.evaluate((selector) => {
    const container = document.querySelector(selector);
    const hot = (container?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const modal = [...(container?.querySelectorAll('[aria-modal="true"]') ?? [])]
      .some(node => node.getBoundingClientRect().width > 0);

    return {
      rows: hot?.countRows() ?? 0,
      cols: hot?.countCols() ?? 0,
      covered: !!hot?.getFocusScopeManager?.()?.isGridBodyCovered?.(),
      modal,
      budget: Math.min(150, (hot?.countCols() ?? 0) + 40),
    };
  }, root);
}

/**
 * Whether a cell can be edited: not read-only and with an editor.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param cell The cell.
 * @returns Whether Enter or F2 should open an editor there.
 */
async function isEditable(page: Page, root: string, [row, col]: [number, number]): Promise<boolean> {
  return page.evaluate(([selector, r, c]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const meta = hot?.getCellMeta(r, c);

    // A checkbox cell toggles on Enter instead of opening an editor, as the guide documents.
    return !!meta && !meta.readOnly && meta.editor !== false && meta.type !== 'checkbox' && hot.getSettings().enterBeginsEditing !== false;
  }, [root, row, col] as const);
}

/**
 * Closes every popup the grid may have open and drops the selection, through the API, so the next
 * probe starts from a grid at rest.
 *
 * @param page The page.
 * @param root The root container selector.
 */
async function resetGrid(page: Page, root: string): Promise<void> {
  await page.evaluate((selector) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const plugin = (name: string) => {
      try {
        const instance = hot.getPlugin(name);

        return instance?.isEnabled?.() ? instance : null;
      } catch {
        return null;
      }
    };
    const editor = hot.getActiveEditor();

    if (editor?.isOpened()) {
      editor.cancelChanges?.();
      if (editor.isOpened()) {
        editor.close();
      }
    }
    plugin('contextMenu')?.close();
    plugin('dropdownMenu')?.close();
    plugin('comments')?.hide();
  }, root);
}

/**
 * Presses Escape until a popup state is closed (up to three times), then reads where the focus is.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param cell The cell the popup opened on.
 * @returns What the Escape test saw.
 */
async function escapeTest(page: Page, root: string, cell: [number, number]) {
  for (let press = 1; press <= 3; press++) {
    await page.keyboard.press('Escape');

    const state = await snapshot(page, root);

    if (state.menus === 0 && !state.editorOpen && !state.comment) {
      const returned = state.active.region === 'grid'
        && JSON.stringify(state.highlight) === JSON.stringify(cell);

      return { closedAfter: press, focusReturned: returned, focus: `${state.active.region} ${state.active.key}`.slice(0, 120), highlight: state.highlight };
    }
  }

  return { closedAfter: null, focusReturned: false, focus: 'unknown', highlight: null, presses: 3 };
}

/**
 * Presses Tab from where the focus is inside an open popup, recording each stop until the focus leaves
 * the product, comes back to a stop, or twelve presses have passed.
 *
 * @param page The page.
 * @param cdp The accessibility session.
 * @param root The root container selector.
 * @returns The stops, the first being where the popup put the focus.
 */
async function popupWalk(page: Page, cdp: CDPSession, root: string): Promise<FocusStop[]> {
  const stops = [await readStop(page, cdp, root)];
  const seen = new Set([stops[0].ref]);

  for (let press = 1; press <= 12; press++) {
    await page.keyboard.press('Tab');

    const next = await readStop(page, cdp, root);

    stops.push(next);
    if (!['grid', 'portal'].includes(next.region) || seen.has(next.ref)) {
      break;
    }
    seen.add(next.ref);
  }

  return stops;
}

/**
 * Gives every form control a walk stopped on an input (Space on a checkbox, ArrowDown on a select, a
 * letter in a text field) and reports an input that changed the context (3.2.2): the page navigated,
 * a popup opened, or the focus left the control.
 *
 * @param page The page.
 * @param cdp The accessibility session.
 * @param root The root container selector.
 * @param stops The stops of the walks.
 * @returns The findings and what each input did.
 */
async function inputTest(page: Page, cdp: CDPSession, root: string, stops: FocusStop[]) {
  const findings: EvidenceFinding[] = [];
  const results: Array<{ locator: string; input: string; change: string | null }> = [];
  const controls = new Map<string, FocusStop>();

  for (const stop of stops) {
    if (['grid', 'portal'].includes(stop.region) && ['input', 'select', 'textarea'].includes(stop.tag)
      && !stop.locator.includes('handsontableInput') && !controls.has(stop.ref)) {
      controls.set(stop.ref, stop);
    }
  }
  for (const [ref, stop] of controls) {
    const control = page.locator(`[data-a11y-walk-ref="${ref}"]`);

    if (!(await control.isVisible())) {
      continue;
    }

    const kind = await control.evaluate(node => (node.tagName === 'SELECT' ? 'select' : (node as HTMLInputElement).type || 'text'));
    const input = { checkbox: 'Space', radio: 'Space', select: 'ArrowDown' }[kind] ?? 'a';

    await control.focus();

    const before = await readStop(page, cdp, root);

    await page.keyboard.press(input);

    const after = await readStop(page, cdp, root);
    let change: string | null = null;

    if (before.signals.url !== after.signals.url) {
      change = `the page navigated to ${after.signals.url}`;
    } else if (after.signals.popups > before.signals.popups && kind !== 'select') {
      change = 'a menu, a dialog or a list opened';
    } else if (after.ref !== before.ref) {
      change = `the focus moved to ${after.locator}`;
    }
    results.push({ locator: stop.locator, input, change });
    if (change) {
      findings.push({
        kind: 'context-change-on-input',
        criteria: ['3.2.2'],
        severity: 'serious',
        selector: stop.locator,
        step: `${input} on the focused control`,
        measured: { change },
        reason: 'Changing the setting of a control changed the context without warning',
      });
    }
  }

  return { findings, results };
}

/**
 * Presses the APG grid keys from one cell of a grid at rest and records where each landed.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param cell The cell every key starts from.
 * @returns The findings and the landings.
 */
async function gridKeysTest(page: Page, root: string, cell: [number, number]) {
  const findings: EvidenceFinding[] = [];
  const landings: Array<{ key: string; status: string; effects: string[]; highlight: [number, number] | null; focus: string }> = [];
  const editable = await isEditable(page, root, cell);
  const edges = await page.evaluate(([selector, [row, col]]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const settings = hot.getSettings();
    const start = settings.fixedColumnsStart ?? 0;
    const last = hot.countCols() - 1 - (settings.fixedColumnsEnd ?? 0);
    const right = hot.isRtl() ? col <= 0 : col >= hot.countCols() - 1;
    const left = hot.isRtl() ? col >= hot.countCols() - 1 : col <= 0;

    return {
      top: row <= 0,
      bottom: row >= hot.countRows() - 1,
      right,
      left,
      start: col <= start,
      end: col >= last,
      origin: row <= (settings.fixedRowsTop ?? 0) && col <= start,
    } as Record<string, boolean>;
  }, [root, cell] as const);

  for (const item of GRID_KEYS) {
    if ((item.edit && !editable) || (item.edge && edges[item.edge])) {
      continue;
    }

    await resetGrid(page, root);
    if (!(await selectThrough(page, root, cell))) {
      continue;
    }
    if (item.prepare) {
      await page.keyboard.press(item.prepare);
    }

    const before = await snapshot(page, root);

    await page.keyboard.press(item.key);

    const after = await snapshot(page, root);
    const verdict = probeVerdict({ expect: item.expect, before, after });

    landings.push({ key: item.key, status: verdict.status, effects: verdict.effects, highlight: after.highlight, focus: after.active.key.slice(0, 80) });
    if (verdict.status === 'focus-left') {
      findings.push({
        kind: 'grid-key-moves-focus-out',
        criteria: ['2.4.3'],
        severity: 'serious',
        step: `${item.key} from (${cell.join(', ')})`,
        measured: { focus: after.active.region, effects: verdict.effects.join(',') },
        reason: `${item.key} moved the focus out of the grid instead of moving it within`,
      });
    } else if (verdict.status !== 'ok') {
      findings.push({
        kind: verdict.status === 'nothing' ? 'grid-key-does-nothing' : 'grid-key-unexpected-effect',
        criteria: ['2.1.1'],
        severity: 'advisory',
        step: `${item.key} from (${cell.join(', ')})`,
        measured: { effects: verdict.effects.join(',') || 'none', expected: item.expect },
        reason: `${item.key} ${verdict.status === 'nothing' ? 'changed nothing' : 'did something else'} on this grid (an edge cell or a frozen band can make that right)`,
      });
    }
  }

  return { findings, landings };
}

/**
 * The tab-order golden of a page: read and compared, or written in update mode.
 *
 * @param pageId The page.
 * @param walks The golden stops of each walk.
 * @returns The advisory findings.
 */
function compareGolden(pageId: string, walks: Record<string, object[]>): EvidenceFinding[] {
  const file = new URL(`${pageId}.json`, GOLDENS);

  if (UPDATE_GOLDENS) {
    mkdirSync(GOLDENS, { recursive: true });
    writeFileSync(file, `${JSON.stringify({ schema: 1, page: pageId, theme: THEME, walks }, null, 2)}\n`);

    return [];
  }
  if (!existsSync(file)) {
    return [{
      kind: 'tab-order-golden-missing',
      criteria: ['2.4.3'],
      severity: 'advisory',
      step: 'Tab walk',
      reason: `No tab-order golden is recorded for this page: run the walker with HOT_A11Y_UPDATE_GOLDENS=1 and review ${pageId}.json`,
    }];
  }

  const golden = JSON.parse(readFileSync(file, 'utf8')) as { walks: Record<string, object[]> };
  const findings: EvidenceFinding[] = [];

  for (const [walk, stops] of Object.entries(walks)) {
    const difference = diffTabOrder(golden.walks[walk] ?? [], stops);

    if (difference) {
      findings.push({
        kind: 'tab-order-changed',
        criteria: ['2.4.3'],
        severity: 'advisory',
        step: `${walk} walk, stop ${difference.index}`,
        measured: {
          expected: JSON.stringify(difference.expected),
          actual: JSON.stringify(difference.actual),
          stops: `${difference.expectedLength} -> ${difference.actualLength}`,
        },
        reason: `The ${walk} tab order differs from its golden (tests/a11y/tab-order-goldens/${pageId}.json): review it, and record it again when the change is right`,
      });
    }
  }

  return findings;
}

/**
 * Walks one page of the catalog in its state.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param entry The catalog entry.
 */
async function walkPage(page: Page, testInfo: TestInfo, entry: A11yPage): Promise<void> {
  const startedAt = Date.now();
  const target = { page: entry.id, theme: THEME, state: entry.state, url: fixtureUrl(entry, THEME) };

  declareTarget(testInfo, target);

  const opened: OpenedTarget = await openTarget(page, entry, THEME);

  await reachState(page, entry, opened);
  await releaseParkedFetches(page);

  const environment = await readEnvironment(page);
  const cdp = await openAxSession(page);
  const { root, cell } = opened;
  const findings: EvidenceFinding[] = [];
  const detail: Record<string, unknown> = { state: entry.state };

  await installSentinels(page, root);

  if (POPUP_STATES.has(entry.state)) {
    const escape = await escapeTest(page, root, cell);

    findings.push(...escapeFindings({ state: entry.state, ...escape }));
    // Open the popup again for the Tab walk inside it.
    await resetGrid(page, root);
    await STATES[entry.state](page, entry, root, cell);
    if (POPUP_ENTRY[entry.state]) {
      await page.keyboard.press(POPUP_ENTRY[entry.state]);
    }

    const stops = await popupWalk(page, cdp, root);
    const walk = walkVerdict({ direction: 'forward', stops: [{ ...stops[0], region: 'start' }, ...stops] });

    findings.push(...walkFindings({
      walk: { ...walk, trapped: false }, stops: [{ ...stops[0], region: 'start' }, ...stops], direction: 'forward', opened: true,
    }));
    findings.push(...compareGolden(entry.id, { popup: goldenStops(stops) }));
    detail.escape = escape;
    detail.popup = stops;
  } else {
    const grid = await gridState(page, root);
    const forward = await tabWalk(page, cdp, root, 'forward', grid.budget);
    const backward = await tabWalk(page, cdp, root, 'backward', grid.budget);
    const forwardVerdict = walkVerdict({ direction: 'forward', ...forward });
    const backwardVerdict = walkVerdict({ direction: 'backward', ...backward });
    let modalExit: string | null = null;

    if (forwardVerdict.modal || backwardVerdict.modal) {
      await page.keyboard.press('Escape');
      if (!(await gridState(page, root)).modal) {
        modalExit = 'Escape closes it';
      } else if (forward.stops.some(item => item.modal && item.role === 'button')) {
        modalExit = 'a button in it';
      }
    }
    findings.push(...walkFindings({ walk: forwardVerdict, stops: forward.stops, direction: 'forward', modalExit }));
    findings.push(...walkFindings({ walk: backwardVerdict, stops: backward.stops, direction: 'backward', modalExit }));
    findings.push(...compareGolden(entry.id, { forward: goldenStops(forward.stops), backward: goldenStops(backward.stops) }));

    const inputs = await inputTest(page, cdp, root, [...forward.stops, ...backward.stops]);

    findings.push(...inputs.findings);
    detail.forward = { verdict: forwardVerdict, stops: forward.stops };
    detail.backward = { verdict: backwardVerdict, stops: backward.stops };
    detail.modalExit = modalExit;
    detail.inputs = inputs.results;

    const now = await gridState(page, root);

    if (REST_STATES.has(entry.state) && now.rows >= 2 && now.cols >= 2 && !now.covered && !now.modal) {
      const keys = await gridKeysTest(page, root, cell);

      findings.push(...keys.findings);
      detail.gridKeys = keys.landings;
    }
  }

  await attachEvidence(testInfo, { target, startedAt, environment, findings, criteria: WALK_CRITERIA, detail });
}

/**
 * Puts the grid in the state a probe starts from.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param probe The probe.
 */
async function setUp(page: Page, root: string, probe: ProbeDefinition): Promise<void> {
  const at = probe.at ?? [1, 1];
  const portalMenu = (name: string) => page.locator(`${name} .ht_master .htCore tbody td`).first();

  if (probe.setup === 'outside') {
    await page.locator('[data-a11y-walk-sentinel="start"]').focus();

    return;
  }

  expect(await selectThrough(page, root, at, probe.setup === 'range' ? probe.to : undefined), `select (${at})`).toBe(true);

  switch (probe.setup) {
    case 'editor':
      await page.keyboard.press('Enter');
      await expect.poll(() => snapshot(page, root).then(state => state.editorOpen), { timeout: 3000 }).toBe(true);
      break;
    case 'context-menu':
      await page.keyboard.press('Shift+F10');
      await expect(portalMenu('.htContextMenu')).toBeVisible({ timeout: 3000 });
      break;
    case 'dropdown-menu':
      await page.keyboard.press('Shift+Alt+ArrowDown');
      await expect(portalMenu('.htDropdownMenu')).toBeVisible({ timeout: 3000 });
      break;
    case 'comment':
      await page.keyboard.press('Control+Alt+m');
      await expect(page.locator('.htComments .htCommentTextArea')).toBeFocused({ timeout: 3000 });
      break;
    case 'freeze-bar':
      await page.keyboard.press('F6');
      await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('.ht-freeze-bar, [class*="freezeBar"], [class*="freeze-bar"]')),
        { timeout: 3000, message: 'F6 put the focus on a freeze bar' }).toBe(true);
      break;
    default:
      break;
  }
}

type PrepareStep = string | { api?: string; focus?: string; type?: string };

interface ProbeDefinition {
  page?: string;
  setup: string;
  at?: [number, number];
  to?: [number, number];
  prepare?: PrepareStep[];
  press: string | Array<string | { key: string; prepare: PrepareStep[] }>;
  then?: PrepareStep[];
  expect: string | string[];
}

// The parts of a snapshot a probe can leave changed for the next one: when any differs from the page as
// it loaded, the page is loaded again, so every probe starts from the same grid.
const STRUCTURAL: Array<keyof GridSnapshot> = ['dataHash', 'merged', 'sorting', 'filtered', 'collapsed', 'frozen', 'rowSelection'];

/**
 * Runs the prepare steps of a probe.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param steps The steps.
 */
async function prepare(page: Page, root: string, steps: ProbeDefinition['prepare'] = []): Promise<void> {
  for (const step of steps) {
    if (typeof step === 'string') {
      await page.keyboard.press(step);
    } else if (step.api) {
      await runApiStep(page, root, step.api);
    } else if (step.focus) {
      await page.locator(`[data-a11y-scan-portal] ${step.focus}`).first().focus({ timeout: 3000 });
    } else if (step.type) {
      await page.keyboard.type(step.type);
    }
  }
}

/**
 * Probes the documented shortcuts of one page.
 *
 * @param page The page.
 * @param testInfo The running test.
 * @param entry The page.
 * @param probes The inventory entries that probe on it.
 */
async function probePage(page: Page, testInfo: TestInfo, entry: A11yPage, probes: typeof SHORTCUT_PROBES): Promise<void> {
  const startedAt = Date.now();
  const target = { page: entry.id, theme: THEME, state: 'none', variant: 'shortcuts', url: fixtureUrl(entry, THEME) };

  declareTarget(testInfo, target);

  const load = async() => {
    const opened = await openTarget(page, { ...entry, state: 'none' }, THEME);

    await reachState(page, { ...entry, state: 'none' }, opened);
    await releaseParkedFetches(page);
    await installSentinels(page, opened.root);
    // A popup library's own portal (hyperformula-ui's on the formula builder page) is marked too, so a key
    // that moves the focus into one of its popups reads as a move inside the product.
    await page.evaluate(attribute => document.querySelectorAll('.hfe-popup-portal')
      .forEach(portal => portal.setAttribute(attribute, '')), PORTAL_MARK);

    return opened;
  };
  const { root } = await load();
  const environment = await readEnvironment(page);
  const pristine = await snapshot(page, root);
  const findings: EvidenceFinding[] = [];
  const problems: string[] = [];
  const results: Array<Record<string, unknown>> = [];
  let reloads = 0;

  for (const item of probes) {
    const probe = item.probe as ProbeDefinition;
    const presses = (Array.isArray(probe.press) ? probe.press : [probe.press])
      .map(press => (typeof press === 'string' ? { key: press, prepare: [] as PrepareStep[] } : press));
    const line = INVENTORY_LINES.get(shortcutKey(item));
    const then = (probe.then ?? []).map(next => (typeof next === 'string' ? next : JSON.stringify(next))).join(', ');

    for (const { key, prepare: steps } of presses) {
      const step = `${item.keys} (${key}${then ? `, then ${then}` : ''}) on ${probe.setup}${probe.at ? ` at (${probe.at.join(', ')})` : ''}`;
      let before: GridSnapshot;
      let after: GridSnapshot;

      try {
        await resetGrid(page, root);

        const current = await snapshot(page, root);

        if (STRUCTURAL.some(field => JSON.stringify(current[field]) !== JSON.stringify(pristine[field]))) {
          await load();
          reloads += 1;
        }
        await setUp(page, root, probe);
        await prepare(page, root, [...(probe.prepare ?? []), ...steps]);
        before = await snapshot(page, root);
        await page.keyboard.press(key);
        // A key that only switches a mode shows its effect on the key after it.
        await prepare(page, root, probe.then);
        after = await snapshot(page, root);
      } catch (error) {
        problems.push(`the probe "${step}" (${item.section}) could not be set up: ${String(error instanceof Error ? error.message : error).split('\n')[0]}`);
        continue;
      }

      const verdict = probeVerdict({ expect: probe.expect, before, after });
      const located = { step, file: INVENTORY_FILE, ...(line ? { line } : {}) };

      results.push({ section: item.section, keys: item.keys, press: key, setup: probe.setup, status: verdict.status, effects: verdict.effects });
      if (verdict.status === 'nothing') {
        findings.push({
          kind: 'shortcut-does-nothing', criteria: ['2.1.1'], severity: 'moderate', ...located,
          measured: { expected: [probe.expect].flat().join(',') },
          reason: `${item.section.replace(/ keyboard shortcuts$/, '')}: ${key} changed nothing, though the guide documents it`,
        });
      } else if (verdict.status === 'focus-left') {
        findings.push({
          kind: 'shortcut-moves-focus-out', criteria: ['2.4.3'], severity: 'serious', ...located,
          measured: { focus: after.active.region, effects: verdict.effects.join(',') },
          reason: `${item.section.replace(/ keyboard shortcuts$/, '')}: ${key} moved the focus out of the grid`,
        });
      } else if (verdict.status === 'unexpected') {
        findings.push({
          kind: 'shortcut-unexpected-effect', criteria: ['2.1.1'], severity: 'advisory', ...located,
          measured: { effects: verdict.effects.join(','), expected: [probe.expect].flat().join(',') },
          reason: `${item.section.replace(/ keyboard shortcuts$/, '')}: ${key} did something other than what the guide documents`,
        });
      }
    }
  }

  const criteria = ['2.1.1', '2.4.3'];

  if (entry.id === SHORTCUTS_PAGE.id) {
    // 2.1.4: with the focus outside the grid, a printable key reaches nothing.
    await load();
    await selectThrough(page, root, [5, 5]);
    await page.locator('[data-a11y-walk-sentinel="start"]').focus();

    const before = await snapshot(page, root);

    for (const key of ['a', 'z', '1', '/', '?']) {
      await page.keyboard.press(key);
    }

    const after = await snapshot(page, root);
    const changed = ['dataHash', 'editorOpen', 'ranges', 'menus', 'comment', 'sorting', 'filtered']
      .filter(field => JSON.stringify(before[field as keyof GridSnapshot]) !== JSON.stringify(after[field as keyof GridSnapshot]));

    results.push({ characterKeysWithoutFocus: changed });
    if (changed.length > 0) {
      findings.push({
        kind: 'character-key-without-focus', criteria: ['2.1.4'], severity: 'serious', step: 'a, z, 1, /, ? with the focus outside the grid',
        measured: { changed: changed.join(',') },
        reason: 'A printable key changed the grid while the grid did not have the focus',
      });
    }
    for (const row of singleCharacterShortcuts(DOCS_ROWS)) {
      findings.push({
        kind: 'single-character-shortcut', criteria: ['2.1.4'], severity: 'advisory', step: `${row.section}: ${row.keys}`,
        reason: 'The guide documents a single-character shortcut; it must work only while the grid has the focus, or be remappable or switchable off',
      });
    }
    criteria.push('2.1.4');
  }

  await attachEvidence(testInfo, { target, startedAt, environment, findings, criteria, detail: { probes: results, reloads }, problems });
}

test.describe.configure({ mode: 'parallel' });

for (const entry of A11Y_PAGES) {
  const body = async({ page }: { page: Page }, testInfo: TestInfo) => walkPage(page, testInfo, entry);
  const title = `walk ${entry.id} on ${THEME}`;

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

const byPage = new Map<string, typeof SHORTCUT_PROBES>();

for (const item of SHORTCUT_PROBES.filter(entry => entry.probe)) {
  const pageId = (item.probe as ProbeDefinition).page ?? SHORTCUTS_PAGE.id;

  byPage.set(pageId, [...(byPage.get(pageId) ?? []), item]);
}
for (const [pageId, probes] of byPage) {
  const entry = pageId === SHORTCUTS_PAGE.id ? SHORTCUTS_PAGE : A11Y_PAGES.find(item => item.id === pageId);

  test(`documented shortcuts on ${pageId}`, async({ page }, testInfo) => {
    expect(entry, `${pageId} is a page of the catalog or the probe page`).toBeDefined();
    await probePage(page, testInfo, entry!, probes);
  });
}
