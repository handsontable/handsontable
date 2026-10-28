import { type Page } from '@playwright/test';
import { PORTAL_MARK } from '../harness';
import { effectsBetween } from '../../lib/keyboard-walker.mjs';
import { snapshot, type GridSnapshot } from './walker';

/**
 * The browser half of the pointer check (`pointer.spec.ts`): the controls a page draws, where a pointer
 * can go that is not on the grid, and what a press changed. The verdicts are `lib/pointer.mjs`.
 */

// What a pointer can operate: native controls, the roles a widget is drawn with, and the header and cell
// buttons that have no role. A cell is not here: a press on a cell selects it, by design.
export const CONTROLS = [
  'button', 'a[href]', 'input[type="checkbox"]', 'input[type="radio"]', '[role="button"]', '[role="menuitem"]', '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]', '[role="option"]', '[role="tab"]', '[role="checkbox"]', '[role="switch"]', '[role="link"]', '.changeType',
  '.columnSorting', '.collapsibleIndicator', '.ht_nestingButton', '.htAutocompleteArrow', '.ht-multi-select-arrow',
].join(', ');
export const TARGET_MARK = 'data-a11y-pointer-target';
const MAX_TARGETS = 12;

export interface PointerTarget {
  id: number;
  selector: string;
  name: string;
}

export type PointerState = GridSnapshot & {
  dialog: boolean;
  toasts: number;
  popups: number;
  sheet: string | null;
  pageNumber: number | null;
  states: string;
};

/**
 * Marks the controls of the grid's root container and its portal that a pointer can reach: visible,
 * enabled, on screen and on top at their center, and not the selected tab or the current page (a click
 * on those does nothing to measure). One control per kind (tag, first class and role), at most twelve,
 * in document order, so marking the same page twice marks the same controls. A link counts its click
 * instead of navigating (`installSentinels()` in `walker.ts`).
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The controls.
 */
export async function markTargets(page: Page, root: string): Promise<PointerTarget[]> {
  return page.evaluate(([selector, portalMark, controls, mark, max]) => {
    const container = document.querySelector(selector);
    // Every marked portal: the grid's own, and on the formula states hyperformula-ui's popup portal.
    const portals = [...document.querySelectorAll(`[${portalMark}]`)];
    const shown = (el: Element) => {
      const box = el.getBoundingClientRect();

      return box.width > 0 && box.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    };
    // With a menu, a dialog or an editor open, a press anywhere else first dismisses it (and commits the
    // editor), so only the controls inside what is open are measured there; the rest are measured on the
    // pages where nothing is open.
    const editor = (container?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance?.getActiveEditor?.();
    const open = (query: string) => [...portals, container].flatMap(region => [...(region?.querySelectorAll(query) ?? [])]).filter(shown);
    const surfaces = [
      ...open('.htContextMenu, .htDropdownMenu, .htFiltersConditionsMenu, .htComments, .ht-dialog, .hfe-suggestions, .hfe-fn-help'),
      // `container` is the element an editor built by the editor factory draws in (the formula editor).
      ...(editor?.isOpened?.()
        ? [editor.TEXTAREA_PARENT, editor.htContainer, editor.selectWrapper, editor.dropdownContainerElement, editor.container].filter(Boolean)
        : []),
    ] as Element[];
    // An open editor whose elements are none of those still makes a press elsewhere commit it.
    const regions = surfaces.length > 0 || editor?.isOpened?.() ? surfaces : [container, ...portals].filter(Boolean) as Element[];
    const volatile = /^(current|area|highlight|htDisabled|htFocus|htSeparator$|ht_[0-9a-f]{6,}$)/;
    const fingerprint = (el: Element) => {
      const name = [...el.classList].find(item => !volatile.test(item));
      const role = el.getAttribute('role');

      return `${el.tagName.toLowerCase()}${name ? `.${name}` : ''}${role ? `[role="${role}"]` : ''}`;
    };
    const seen = new Set<string>();
    const targets: { id: number; selector: string; name: string }[] = [];

    for (const region of regions) {
      for (const el of region.querySelectorAll(controls)) {
        const box = el.getBoundingClientRect();
        const x = box.x + (box.width / 2);
        const y = box.y + (box.height / 2);
        const hit = document.elementFromPoint(x, y);
        const key = fingerprint(el);

        if (targets.length >= max || seen.has(key) || el.closest('.ht_editor_hidden, .htSeparator')
          || el.matches('[aria-disabled="true"], :disabled, .htDisabled, [aria-selected="true"], [aria-current], [class*="--active"]') || box.width < 2 || box.height < 2
          || x < 0 || y < 0 || x > innerWidth || y > innerHeight || !hit || !el.contains(hit)) {
          continue;
        }
        seen.add(key);
        el.setAttribute(mark, String(targets.length));
        targets.push({ id: targets.length, selector: key, name: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40) });
      }
    }

    return targets;
  }, [root, PORTAL_MARK, CONTROLS, TARGET_MARK, MAX_TARGETS] as const);
}

/**
 * The center of a marked control, and a point away from the grid and its portal (a corner of the
 * viewport that neither covers) where a press can be released.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param id The control's mark.
 * @returns Both points, or `null` when the control is gone.
 */
export async function targetPoints(page: Page, root: string, id: number) {
  return page.evaluate(([selector, portalMark, mark, target]) => {
    const el = document.querySelector(`[${mark}="${target}"]`);

    if (!el) {
      return null;
    }

    const box = el.getBoundingClientRect();
    const regions = [document.querySelector(selector), ...document.querySelectorAll(`[${portalMark}]`)].filter(Boolean) as Element[];
    const corners = [[4, innerHeight - 4], [innerWidth - 4, innerHeight - 4], [4, 4], [innerWidth - 4, 4]];
    const away = corners.find(([x, y]) => {
      const hit = document.elementFromPoint(x, y);

      return !hit || !regions.some(region => region.contains(hit));
    }) ?? corners[0];

    return { at: { x: box.x + (box.width / 2), y: box.y + (box.height / 2) }, away: { x: away[0], y: away[1] } };
  }, [root, PORTAL_MARK, TARGET_MARK, id] as const);
}

/**
 * The walker's grid snapshot (`walker.ts`), plus what a pointer press can change that a key press does
 * not reach: the dialog, the notifications, any popup with a role, the sheet, the page, and the checked,
 * pressed and expanded states of the controls outside the grid's cells and headers.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The state.
 */
export async function pointerState(page: Page, root: string): Promise<PointerState> {
  const grid = await snapshot(page, root);
  const extra = await page.evaluate(([selector, portalMark]) => {
    const container = document.querySelector(selector);
    const regions = [container, ...document.querySelectorAll(`[${portalMark}]`)].filter(Boolean) as Element[];
    const all = (query: string) => regions.flatMap(region => [...region.querySelectorAll(query)]);
    const shown = (el: Element) => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);

      return box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    };
    const hot = (container?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const plugin = (name: string) => {
      try {
        const instance = hot?.getPlugin(name);

        return instance?.isEnabled?.() ? instance : null;
      } catch {
        return null;
      }
    };

    return {
      dialog: !!plugin('dialog')?.isVisible?.(),
      toasts: all('.ht-notification__toast').filter(shown).length,
      popups: all('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]').filter(shown).length,
      sheet: all('[role="tab"][aria-selected="true"]').map(tab => (tab.textContent ?? '').trim()).join('|') || null,
      pageNumber: plugin('pagination')?.getPaginationData?.()?.currentPage ?? null,
      // The controls drawn in the grid's own cells and headers are left out: their states follow the data,
      // the sort and the collapsed groups (read above), and a scroll redraws other rows into the same nodes.
      states: all('[aria-checked], [aria-pressed], [aria-expanded], input[type="checkbox"], input[type="radio"]')
        .filter(el => !(container?.contains(el) && el.closest('.htCore')))
        .map(el => `${el.getAttribute('aria-checked') ?? ''}${el.getAttribute('aria-pressed') ?? ''}${el.getAttribute('aria-expanded') ?? ''}${(el as HTMLInputElement).checked ?? ''}`)
        .join(','),
    };
  }, [root, PORTAL_MARK] as const);

  return { ...grid, ...extra };
}

/**
 * What changed between two pointer states: the walker's effects, and the popup, sheet, page and state
 * effects only a pointer state reads.
 *
 * @param before The state before.
 * @param after The state after.
 * @returns The effects, sorted.
 */
export function pointerEffects(before: PointerState, after: PointerState): string[] {
  const effects = new Set<string>(effectsBetween(before, after));
  const opened = (after.popups + Number(after.dialog) + after.toasts) - (before.popups + Number(before.dialog) + before.toasts);

  if (opened > 0) {
    effects.add('popup-opens');
  }
  if (opened < 0) {
    effects.add('popup-closes');
  }
  if (before.sheet !== after.sheet) {
    effects.add('sheet-changes');
  }
  if (before.pageNumber !== after.pageNumber) {
    effects.add('page-changes');
  }
  if (before.states !== after.states) {
    effects.add('state-changes');
  }

  return [...effects].sort();
}
