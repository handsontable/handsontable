import { expect, type CDPSession, type Page } from '@playwright/test';
import { PORTAL_MARK } from '../harness';

/**
 * The browser half of the keyboard walker (`keyboard-walker.spec.ts`): the sentinels a walk starts and
 * ends on, the reader of a focus stop, the snapshot of the grid around a key, and the steps a probe
 * prepares. What is recorded here is judged by `lib/keyboard-walker.mjs`. Every page function is
 * spelled out inside its `evaluate`: Playwright serializes the callback's source, so a helper defined
 * in this file is not visible in the page.
 */

export interface FocusStop {
  region: string;
  ref: string;
  cell: [number, number] | null;
  locator: string;
  tag: string;
  modal: boolean;
  role: string;
  name: string;
  ignored: boolean;
  signals: { url: string; popups: number; editorOpen: boolean };
  contextChange?: string;
}

export interface GridSnapshot {
  highlight: [number, number] | null;
  ranges: number[][];
  editorOpen: boolean;
  editorText: string | null;
  caret: [number, number] | null;
  focusedText: string | null;
  menus: number;
  menuItem: string | null;
  comment: boolean;
  dataHash: string;
  scroll: [number, number];
  sorting: string;
  merged: number;
  frozen: string;
  clipboard: number;
  links: number;
  collapsed: string;
  filtered: string;
  listSelection: string | null;
  rowSelection: string | null;
  active: { region: string; key: string };
}

/**
 * Puts a focusable sentinel right before and right after the grid's root container, so a Tab walk
 * covers exactly the grid (its focus catchers, cells, bars and overlays) and nothing else of the
 * fixture page. Also counts the links the page opens (`window.open`, a followed anchor), for the
 * Alt+Enter probe, without letting the page navigate away.
 *
 * @param page The page.
 * @param root The root container selector.
 */
export async function installSentinels(page: Page, root: string): Promise<void> {
  await page.evaluate((selector) => {
    const container = document.querySelector(selector) as HTMLElement;
    const make = (name: string) => {
      const button = document.createElement('button');

      button.type = 'button';
      button.textContent = `a11y walk ${name}`;
      button.dataset.a11yWalkSentinel = name;
      button.style.cssText = 'position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden';

      return button;
    };
    const win = window as unknown as { __a11yWalkRefs: number; __a11yLinks: number };

    container.before(make('start'));
    container.after(make('end'));
    win.__a11yWalkRefs = 0;
    win.__a11yLinks = 0;
    window.open = () => {
      win.__a11yLinks += 1;

      return null;
    };
    document.addEventListener('click', (event) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]');

      if (anchor) {
        event.preventDefault();
        win.__a11yLinks += 1;
      }
    }, true);
  }, root);
}

/**
 * Opens a CDP session that reads the accessibility tree of the focused element.
 *
 * @param page The page.
 * @returns The session.
 */
export async function openAxSession(page: Page): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);

  await cdp.send('DOM.enable');
  await cdp.send('Accessibility.enable');

  return cdp;
}

/**
 * The accessible role and name Chromium computes for the focused element (the deepest one, through
 * shadow roots), and whether the accessibility tree ignores it.
 *
 * @param cdp The session.
 * @returns The role, the name and the ignored flag.
 */
export async function focusedAx(cdp: CDPSession): Promise<{ role: string; name: string; ignored: boolean }> {
  const { result } = await cdp.send('Runtime.evaluate', {
    expression: '(() => { let e = document.activeElement; while (e && e.shadowRoot && e.shadowRoot.activeElement) { e = e.shadowRoot.activeElement; } return e; })()',
    objectGroup: 'a11y-walk',
  });

  try {
    if (!result.objectId) {
      return { role: '', name: '', ignored: true };
    }

    const { node } = await cdp.send('DOM.describeNode', { objectId: result.objectId });
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false });
    const own = nodes.find(item => item.backendDOMNodeId === node.backendNodeId) ?? nodes[0];

    return {
      role: String(own?.role?.value ?? ''),
      name: String(own?.name?.value ?? ''),
      ignored: own?.ignored === true,
    };
  } finally {
    await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'a11y-walk' });
  }
}

/**
 * Reads the focus stop the last key left: where the focused element is (the sentinels, the grid, its
 * portal, elsewhere on the page, or nowhere), the cell it is on, a short locator, whether a modal
 * dialog holds it, and the signals a change of context shows (the URL, the open popups, an open
 * editor). Two animation frames pass first, so the focus moves the grid makes in its own handlers
 * have landed.
 *
 * @param page The page.
 * @param cdp The accessibility session.
 * @param root The root container selector.
 * @returns The stop.
 */
export async function readStop(page: Page, cdp: CDPSession, root: string): Promise<FocusStop> {
  const dom = await page.evaluate(async([selector, portalMark]) => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    let el = document.activeElement as HTMLElement | null;

    while (el?.shadowRoot?.activeElement) {
      el = el.shadowRoot.activeElement as HTMLElement;
    }

    const container = document.querySelector(selector);
    // Every marked portal counts: a state whose popups mount in a portal of their own marks that one too.
    const portals = [...document.querySelectorAll(`[${portalMark}]`)];
    const portal = { contains: (node: Node | null) => portals.some(item => item.contains(node)) };
    const hot = (container?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const win = window as unknown as { __a11yWalkRefs: number };
    let region = 'outside';

    if (!el || el === document.body || el === document.documentElement || !document.hasFocus()) {
      region = 'body';
    } else if (el.dataset.a11yWalkSentinel) {
      region = el.dataset.a11yWalkSentinel;
    } else if (container?.contains(el)) {
      region = 'grid';
    } else if (portal?.contains(el)) {
      region = 'portal';
    }
    if (el && region !== 'body' && !el.dataset.a11yWalkRef) {
      win.__a11yWalkRefs += 1;
      el.dataset.a11yWalkRef = String(win.__a11yWalkRefs);
    }

    let cell: [number, number] | null = null;

    if (hot && region === 'grid' && el && (el.tagName === 'TD' || el.tagName === 'TH')) {
      const coords = hot.getCoords(el);

      if (coords && coords.row !== null && coords.col !== null) {
        cell = [coords.row, coords.col];
      }
    }

    const volatile = /^(current|area|highlight|fullySelected|ht__highlight|ht__active_highlight|htFocus.*|ht_[0-9a-f]+|mark.*)$/;
    const classes = el ? [...el.classList].filter(name => !volatile.test(name)).slice(0, 2) : [];
    const role = el?.getAttribute('role');
    const visible = (node: Element) => {
      const box = node.getBoundingClientRect();

      return box.width > 0 && box.height > 0 && getComputedStyle(node).visibility !== 'hidden';
    };
    const popups = [container, ...portals].filter(Boolean).flatMap(scope => [...(scope as Element)
      .querySelectorAll('[role="menu"], [role="dialog"], [role="alertdialog"], [role="listbox"], .htContextMenu, .htDropdownMenu, .htComments')])
      .filter(visible).length;

    return {
      region,
      ref: el?.dataset.a11yWalkRef ?? 'body',
      cell,
      locator: el ? `${el.tagName.toLowerCase()}${classes.map(name => `.${name}`).join('')}${role ? `[role="${role}"]` : ''}` : 'body',
      tag: el?.tagName.toLowerCase() ?? 'body',
      modal: !!el?.closest('[aria-modal="true"]'),
      signals: { url: location.href, popups, editorOpen: !!hot?.getActiveEditor()?.isOpened() },
    };
  }, [root, PORTAL_MARK] as const);
  const ax = dom.region === 'body' || dom.region === 'start' || dom.region === 'end'
    ? { role: '', name: '', ignored: false }
    : await focusedAx(cdp);

  return { ...dom, ...ax };
}

/**
 * What changed the context between two stops, beyond the focus move itself: the URL, a popup that
 * opened, an editor that opened. `null` when nothing did.
 *
 * @param before The stop before the key.
 * @param after The stop after it.
 * @returns The change, in words, or `null`.
 */
export function contextChange(before: FocusStop, after: FocusStop): string | null {
  if (before.signals.url !== after.signals.url) {
    return `the page navigated to ${after.signals.url}`;
  }
  if (after.signals.popups > before.signals.popups) {
    return 'a menu, a dialog or a list opened';
  }
  if (!before.signals.editorOpen && after.signals.editorOpen) {
    return 'a cell editor opened';
  }

  return null;
}

/**
 * Walks the focus with Tab (or Shift+Tab) from one sentinel until it reaches the other, leaves the
 * document, comes back to a stop it visited, or runs out of presses. When the presses run out inside
 * the grid, it tries the way out the shortcut guide documents for a grid whose Tab wraps rows: Ctrl+End
 * then Tab (Ctrl+Home then Shift+Tab backward), for up to 150 more presses, and says whether that
 * left the grid.
 *
 * @param page The page.
 * @param cdp The accessibility session.
 * @param root The root container selector.
 * @param direction The direction.
 * @param budget The most presses.
 * @returns The stops and whether the presses ran out.
 */
export async function tabWalk(page: Page, cdp: CDPSession, root: string, direction: 'forward' | 'backward', budget: number) {
  const from = direction === 'forward' ? 'start' : 'end';
  const goal = direction === 'forward' ? 'end' : 'start';
  const key = direction === 'forward' ? 'Tab' : 'Shift+Tab';

  await page.locator(`[data-a11y-walk-sentinel="${from}"]`).focus();

  const stops = [await readStop(page, cdp, root)];
  const seen = new Set([identity(stops[0])]);

  for (let press = 1; press <= budget; press++) {
    await page.keyboard.press(key);

    const next = await readStop(page, cdp, root);
    const change = contextChange(stops.at(-1)!, next);

    stops.push(change ? { ...next, contextChange: change } : next);
    if (next.region === goal || next.region === 'body' || seen.has(identity(next))) {
      return { stops, budgetExhausted: false };
    }
    seen.add(identity(next));
  }

  const route = direction === 'forward' ? 'ControlOrMeta+End' : 'ControlOrMeta+Home';
  let routePresses = 0;
  let left = false;

  if (['grid', 'portal'].includes(stops.at(-1)!.region)) {
    await page.keyboard.press(route);
    // A grid with navigable headers on several levels walks back through every header row first.
    for (routePresses = 1; routePresses <= 150 && !left; routePresses++) {
      await page.keyboard.press(key);

      const next = await readStop(page, cdp, root);

      left = next.region === goal || next.region === 'body';
    }
  }

  return {
    stops,
    budgetExhausted: true,
    exitRoute: { keys: `${direction === 'forward' ? 'Ctrl+End' : 'Ctrl+Home'}, then ${key}`, left, presses: routePresses },
  };
}

/**
 * The identity of a stop, as `stopKey()` of `lib/keyboard-walker.mjs` reads it.
 *
 * @param stop The stop.
 * @returns The key.
 */
function identity(stop: FocusStop): string {
  return stop.cell ? `${stop.region}|cell|${stop.cell[0]},${stop.cell[1]}` : `${stop.region}|${stop.ref}`;
}

/**
 * A snapshot of what a key can change: the selection, the editor and its text and caret, the menus
 * and their highlighted item, the comment editor, the data, the scroll, the sort, the merges, the
 * frozen counts, the clipboard and link counters, the collapsed groups, the filters, and where the
 * focus is. One evaluation, after two animation frames.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The snapshot.
 */
export async function snapshot(page: Page, root: string): Promise<GridSnapshot> {
  return page.evaluate(async([selector, portalMark]) => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const container = document.querySelector(selector);
    // Every marked portal counts: a state whose popups mount in a portal of their own marks that one too.
    const portals = [...document.querySelectorAll(`[${portalMark}]`)];
    const portal = { contains: (node: Node | null) => portals.some(item => item.contains(node)) };
    const hot = (container?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const plugin = (name: string) => {
      try {
        const instance = hot?.getPlugin(name);

        return instance?.isEnabled?.() ? instance : null;
      } catch {
        return null;
      }
    };
    const visible = (node: Element) => {
      const box = node.getBoundingClientRect();

      return box.width > 0 && box.height > 0 && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden';
    };
    const menus = [...document.querySelectorAll('.htContextMenu, .htDropdownMenu')]
      .filter(node => (portal?.contains(node) || container?.contains(node)) && visible(node));
    const highlighted = menus.at(-1)?.querySelector('.ht_master .htCore tbody td.current');
    const editor = hot?.getActiveEditor();
    const editorOpen = !!editor?.isOpened();
    let editorText: string | null = null;
    let caret: [number, number] | null = null;

    if (editorOpen) {
      try {
        const value = editor.getValue();

        editorText = typeof value === 'string' ? value : JSON.stringify(value);
      } catch {
        editorText = null;
      }

      const input = editor.TEXTAREA ?? editor.TEXTAREA_PARENT?.querySelector?.('textarea, input');

      if (input && typeof input.selectionStart === 'number') {
        caret = [input.selectionStart, input.selectionEnd];
      }
    }

    let el = document.activeElement as HTMLElement | null;

    while (el?.shadowRoot?.activeElement) {
      el = el.shadowRoot.activeElement as HTMLElement;
    }

    let region = 'outside';

    if (!el || el === document.body || !document.hasFocus()) {
      region = 'body';
    } else if (el.dataset.a11yWalkSentinel) {
      region = el.dataset.a11yWalkSentinel;
    } else if (container?.contains(el)) {
      region = 'grid';
    } else if (portal?.contains(el)) {
      region = 'portal';
    }

    let key = region;

    if (el && region === 'grid' && (el.tagName === 'TD' || el.tagName === 'TH')) {
      const coords = hot.getCoords(el);

      key = `cell|${coords?.row},${coords?.col}`;
    } else if (el && region !== 'body') {
      // Every element gets an identity of its own, so two list items that look alike are still two stops;
      // a list that keeps the focus on its input moves `aria-activedescendant` instead, which is a move too.
      // So does the part of the root wrapper the element is in (the top slot, the grid, the bottom slot):
      // the formula editor is one element, which F6 moves between the cell and the formula bar.
      const store = window as unknown as { __a11yIds?: WeakMap<Element, number>; __a11yIdCount?: number };
      const area = region === 'grid'
        ? [...(container?.querySelector('.ht-root-wrapper')?.children ?? [])].find(child => child.contains(el))?.classList[0] ?? ''
        : '';

      store.__a11yIds ??= new WeakMap<Element, number>();
      if (!store.__a11yIds.has(el)) {
        store.__a11yIdCount = (store.__a11yIdCount ?? 0) + 1;
        store.__a11yIds.set(el, store.__a11yIdCount);
      }
      key = `${region}|${area}|${el.tagName}#${store.__a11yIds.get(el)}|${el.getAttribute('aria-activedescendant') ?? ''}`;
    }

    // The text of the focused text field (the formula bar's address box, a menu's search field, an editor's
    // own field), so a key that only rewrites a field the cell editor does not own is seen too.
    const field = el && (region === 'grid' || region === 'portal') && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
      ? el as HTMLInputElement
      : null;

    const data = JSON.stringify(hot?.getSourceData?.() ?? hot?.getData?.() ?? null);
    let hash = 0;

    for (let index = 0; index < data.length; index++) {
      hash = Math.imul(31, hash) + data.charCodeAt(index) | 0;
    }

    const holder = container?.querySelector('.ht_master .wtHolder');
    const range = hot?.getSelectedRangeActive?.() ?? hot?.getSelectedRangeLast?.();
    const comments = plugin('comments');
    const nestedRows = plugin('nestedRows');
    const collapsible = plugin('collapsibleColumns');
    const filters = plugin('filters');
    const sorting = plugin('multiColumnSorting') ?? plugin('columnSorting');
    const merge = plugin('mergeCells');
    const win = window as unknown as { __a11yClipboard?: number; __a11yLinks?: number };
    const settings = hot?.getSettings() ?? {};
    const rowSelection = plugin('rowSelection');

    return {
      highlight: range ? [range.highlight.row, range.highlight.col] as [number, number] : null,
      ranges: hot?.getSelected() ?? [],
      editorOpen,
      editorText,
      caret,
      focusedText: field ? field.value : null,
      menus: menus.length,
      menuItem: highlighted ? (highlighted.textContent ?? '').trim() : null,
      comment: !!comments?.getEditorInputElement?.() && visible(comments.getEditorInputElement().closest('.htComments') ?? comments.getEditorInputElement()),
      dataHash: `${data.length}:${hash}`,
      scroll: [Math.round(holder?.scrollTop ?? 0), Math.round(holder?.scrollLeft ?? 0)] as [number, number],
      sorting: JSON.stringify(sorting?.getSortConfig?.() ?? []),
      merged: merge?.mergedCellsCollection?.mergedCells?.length ?? 0,
      frozen: `${settings.fixedRowsTop ?? 0},${settings.fixedColumnsStart ?? 0},${settings.fixedRowsBottom ?? 0},${settings.fixedColumnsEnd ?? 0}`,
      clipboard: win.__a11yClipboard ?? 0,
      links: win.__a11yLinks ?? 0,
      collapsed: JSON.stringify([
        nestedRows?.collapsingUI?.collapsedRows ?? null,
        collapsible?.getCollapsedColumns?.() ?? null,
        hot?.countRows?.() ?? null,
        hot?.countRenderedCols?.() ?? null,
      ]),
      filtered: JSON.stringify(filters?.exportConditions?.() ?? null),
      listSelection: editorOpen && editor.htEditor ? JSON.stringify(editor.htEditor.getSelected() ?? null) : null,
      rowSelection: rowSelection ? JSON.stringify(rowSelection.getSelectedRows?.() ?? rowSelection.getSelected?.() ?? null) : null,
      active: { region, key },
    };
  }, [root, PORTAL_MARK] as const);
}

/**
 * Selects through the API: a cell, a range, or a header (a negative row or column, which needs
 * `navigableHeaders`), and leaves the browser focus on it.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param from The cell, or the range's start.
 * @param to The range's end, when a range.
 * @returns Whether the grid took the selection.
 */
export async function selectThrough(page: Page, root: string, from: [number, number], to?: [number, number]): Promise<boolean> {
  return page.evaluate(([selector, [row, col], end]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;

    if (!hot) {
      return false;
    }

    hot.listen();

    const selected = end ? hot.selectCell(row, col, end[0], end[1]) : hot.selectCell(row, col);

    hot.getFocusManager?.()?.focusOnHighlightedCell?.();

    return selected !== false;
  }, [root, from, to ?? null] as const);
}

/**
 * Runs one named prepare step of a probe (`{ api: '<name>' }` in `keyboard-shortcuts.mjs`).
 *
 * @param page The page.
 * @param root The root container selector.
 * @param name The step.
 */
export async function runApiStep(page: Page, root: string, name: string): Promise<void> {
  const done = await page.evaluate(([selector, step]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const highlight = hot?.getSelectedRangeLast()?.highlight;

    switch (step) {
      case 'scrollAway':
        // Scroll the viewport off the selected cell without moving the selection.
        hot.scrollViewportTo({ row: hot.countRows() - 1, col: hot.countCols() - 1 });

        return true;
      case 'change':
        hot.setDataAtCell(highlight.row, highlight.col, 'Changed by the walker');

        return true;
      case 'undo':
        hot.getPlugin('undoRedo').undo();

        return true;
      case 'check':
        // A checkbox cell the probe unchecks starts checked, whatever an earlier probe left.
        hot.setDataAtCell(highlight.row, highlight.col, true);

        return true;
      case 'filter': {
        const filters = hot.getPlugin('filters');

        filters.addCondition(0, 'neq', ['nothing matches this']);
        filters.filter();

        return true;
      }
      case 'selectNeighbor':
        hot.selectCell(highlight.row + 2, highlight.col);

        return true;
      case 'sortFirstColumn':
        (hot.getPlugin('multiColumnSorting') ?? hot.getPlugin('columnSorting')).sort({ column: 0, sortOrder: 'asc' });
        hot.selectCell(-1, 3);

        return true;
      default:
        return false;
    }
  }, [root, name] as const);

  expect(done, `the prepare step "${name}" exists`).toBe(true);
}
