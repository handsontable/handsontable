import { expect, type Page } from '@playwright/test';
import { PORTAL_MARK } from '../harness';

/**
 * Runs the steps of `drag-operations.mjs` with a real pointer and keyboard, and reads what a drag
 * changes: sizes, order, data, frozen counts, the selection, the sheets, the comment editor's size, and
 * the open editor's text.
 */

export type Point =
  | { cell: [number, number] }
  | { colHeader: number }
  | { rowHeader: number }
  | { selector: string; at?: 'center' | 'corner-end' }
  | { text: string; within: string };

export type Step =
  | { select: number[] }
  | { api: 'colWidth' | 'rowHeight'; index: number; size: number }
  | { api: 'empty'; range: [number, number, number, number] }
  | { hover: Point }
  | { click: Point; button?: 'left' | 'right'; modifiers?: ('Shift' | 'Control' | 'Alt' | 'Meta')[] }
  | { dblclick: Point }
  | { drag: { from: Point; to?: Point; by?: [number, number] } }
  | { touchDrag: { from: Point; to: Point } }
  | { press: string | string[] }
  | { pressUntilFocused: { key: string; selector: string } }
  | { pressUntilHighlighted: { key: string; text: string } }
  | { focus: string }
  | { visible: string };

export interface DragState {
  widths: number[];
  heights: number[];
  columnOrder: number[];
  rowOrder: number[];
  data: string;
  frozen: string;
  selected: number[][];
  sheets: string[];
  comment: number[];
  editorText: string | null;
}

const STEPS_PER_DRAG = 10;
const PRESS_LIMIT = 12;

/**
 * Where a point is on the page now.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param point The point.
 * @returns The coordinates; the test fails when the point is not drawn.
 */
export async function resolvePoint(page: Page, root: string, point: Point): Promise<{ x: number; y: number }> {
  const found = await page.evaluate(([selector, portalMark, spec]) => {
    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const shown = (el: Element | null | undefined): el is Element => {
      const box = el?.getBoundingClientRect();

      return !!box && box.width > 0 && box.height > 0 && getComputedStyle(el as Element).visibility !== 'hidden';
    };
    let el: Element | null | undefined = null;

    if ('cell' in spec) {
      el = hot?.getCell(spec.cell[0], spec.cell[1], true);
    } else if ('colHeader' in spec) {
      el = hot?.getCell(-1, spec.colHeader, true);
    } else if ('rowHeader' in spec) {
      el = hot?.getCell(spec.rowHeader, -1, true);
    } else if ('selector' in spec) {
      const regions = [document.querySelector(selector), ...document.querySelectorAll(`[${portalMark}]`), document];

      el = regions.flatMap(region => [...(region?.querySelectorAll(spec.selector) ?? [])]).find(shown);
    } else {
      // The smallest element whose text starts with it: a list's text starts with its first item's too.
      const area = (node: Element) => node.getBoundingClientRect().width * node.getBoundingClientRect().height;

      el = [...document.querySelectorAll(`${spec.within} td, ${spec.within} [role]`)]
        .filter(node => shown(node) && (node.textContent ?? '').trim().startsWith(spec.text))
        .sort((left, right) => area(left) - area(right))[0];
    }
    if (!shown(el)) {
      return null;
    }

    const box = el.getBoundingClientRect();

    return 'at' in spec && spec.at === 'corner-end'
      ? { x: box.right - 4, y: box.bottom - 4 }
      : { x: box.x + (box.width / 2), y: box.y + (box.height / 2) };
  }, [root, PORTAL_MARK, point] as const);

  expect(found, `the point ${JSON.stringify(point)} is drawn`).not.toBeNull();

  return found!;
}

/**
 * Runs steps in order.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param steps The steps.
 */
export async function runSteps(page: Page, root: string, steps: Step[]): Promise<void> {
  for (const step of steps) {
    if ('select' in step) {
      await page.evaluate(([selector, coords]) => {
        const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;

        hot.selectCell(...coords);
        hot.listen();
      }, [root, step.select] as const);
    } else if ('api' in step) {
      await page.evaluate(([selector, call]) => {
        const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;

        if (call.api === 'empty') {
          const [fromRow, fromCol, toRow, toCol] = call.range;
          const changes = [];

          for (let row = fromRow; row <= toRow; row++) {
            for (let col = fromCol; col <= toCol; col++) {
              changes.push([row, col, null]);
            }
          }
          hot.setDataAtCell(changes);
        } else {
          hot.getPlugin(call.api === 'colWidth' ? 'manualColumnResize' : 'manualRowResize').setManualSize(call.index, call.size);
          hot.render();
        }
      }, [root, step] as const);
    } else if ('hover' in step) {
      const at = await resolvePoint(page, root, step.hover);

      await page.mouse.move(at.x, at.y, { steps: 2 });
    } else if ('click' in step) {
      const at = await resolvePoint(page, root, step.click);

      for (const key of step.modifiers ?? []) {
        await page.keyboard.down(key);
      }
      await page.mouse.click(at.x, at.y, { button: step.button ?? 'left' });
      for (const key of step.modifiers ?? []) {
        await page.keyboard.up(key);
      }
    } else if ('dblclick' in step) {
      const at = await resolvePoint(page, root, step.dblclick);

      await page.mouse.dblclick(at.x, at.y);
    } else if ('drag' in step) {
      const from = await resolvePoint(page, root, step.drag.from);

      await page.mouse.move(from.x, from.y, { steps: 2 });
      await page.mouse.down();

      const end = step.drag.to ? await resolvePoint(page, root, step.drag.to) : from;
      const to = { x: end.x + (step.drag.by?.[0] ?? 0), y: end.y + (step.drag.by?.[1] ?? 0) };

      await page.mouse.move(to.x, to.y, { steps: STEPS_PER_DRAG });
      await page.mouse.up();
    } else if ('touchDrag' in step) {
      const from = await resolvePoint(page, root, step.touchDrag.from);
      const to = await resolvePoint(page, root, step.touchDrag.to);
      const client = await page.context().newCDPSession(page);

      // Playwright's touchscreen only taps: a touch drag goes through the DevTools protocol (tests/AGENTS.md).
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
      for (let index = 1; index <= STEPS_PER_DRAG; index++) {
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: from.x + ((to.x - from.x) * index / STEPS_PER_DRAG), y: from.y + ((to.y - from.y) * index / STEPS_PER_DRAG) }],
        });
      }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await client.detach();
    } else if ('press' in step) {
      for (const key of [step.press].flat()) {
        await page.keyboard.press(key);
      }
    } else if ('pressUntilFocused' in step) {
      const { key, selector } = step.pressUntilFocused;
      let reached = false;

      for (let count = 0; count < PRESS_LIMIT && !reached; count++) {
        await page.keyboard.press(key);
        reached = await page.evaluate(query => !!document.activeElement?.matches(query), selector);
      }
      expect(reached, `${key} reaches ${selector}`).toBe(true);
    } else if ('pressUntilHighlighted' in step) {
      const { key, text } = step.pressUntilHighlighted;
      const highlighted = () => page.evaluate(() => {
        const current = [...document.querySelectorAll('.htContextMenu td.current, .htSheetsBarMenu td.current, [role="menu"] [role="menuitem"]:focus')]
          .find(node => node.getBoundingClientRect().width > 0);

        return (current?.textContent ?? '').trim();
      });
      let reached = (await highlighted()).startsWith(text);

      for (let count = 0; count < PRESS_LIMIT && !reached; count++) {
        await page.keyboard.press(key);
        reached = (await highlighted()).startsWith(text);
      }
      expect(reached, `${key} highlights ${text}`).toBe(true);
    } else if ('focus' in step) {
      await page.locator(step.focus).first().focus();
    } else {
      await expect(page.locator(step.visible).first()).toBeVisible();
    }
  }
}

/**
 * Reads the state after the last step until it has the expected effect, for up to two seconds: a
 * double-click autofit runs from a timer and a sheet tab settles after its transition. An alternative
 * that never has the effect returns its last read. A read that throws (the page crashed, or a step left
 * no grid to read) is thrown with its cause: only the poll running out means the effect never came.
 *
 * @param page The page.
 * @param root The root container selector.
 * @param before The state before the last step.
 * @param effect The expected effect.
 * @returns The state and its effects.
 */
export async function settledState(page: Page, root: string, before: DragState, effect: string) {
  let after = await dragState(page, root);
  let effects = dragEffects(before, after);
  let readError: unknown = null;

  try {
    await expect.poll(async() => {
      try {
        after = await dragState(page, root);
        readError = null;
      } catch (error) {
        readError = error;
        throw error;
      }
      effects = dragEffects(before, after);

      return effects.includes(effect);
    }, { timeout: 2000, intervals: [100] }).toBe(true);
  } catch {
    if (readError) {
      throw readError;
    }
    // The effect never came: the alternative does not have it.
  }

  return { after, effects };
}

/**
 * What a drag can change, read in one evaluation after two animation frames.
 *
 * @param page The page.
 * @param root The root container selector.
 * @returns The state.
 */
export async function dragState(page: Page, root: string): Promise<DragState> {
  return page.evaluate(async(selector) => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const hot = (document.querySelector(selector)?.querySelector('.ht-root-wrapper') as (HTMLElement & { __hotInstance?: any }) | null)?.__hotInstance;
    const settings = hot.getSettings();
    const count = (total: number) => Array.from({ length: Math.min(total, 10) }, (_, index) => index);
    const data = JSON.stringify(hot.getData());
    let hash = 0;

    for (let index = 0; index < data.length; index++) {
      hash = Math.imul(31, hash) + data.charCodeAt(index) | 0;
    }

    const sheets = (() => {
      try {
        return hot.getPlugin('sheetsBar')?.isEnabled?.() ? hot.getPlugin('sheetsBar').getSheets().map((sheet: { name: string }) => sheet.name) : [];
      } catch {
        return [];
      }
    })();
    const textarea = [...document.querySelectorAll('.htCommentTextArea')].find(node => node.getBoundingClientRect().width > 0);
    const box = textarea?.getBoundingClientRect();
    // The open editor's text, read the way the keyboard walker reads it (`snapshot()` in `walker.ts`): a
    // reference picked into a formula changes nothing else here until the edit is committed.
    const editor = hot.getActiveEditor();
    const editorText = (() => {
      if (!editor?.isOpened?.()) {
        return null;
      }
      try {
        const value = editor.getValue();

        return typeof value === 'string' ? value : JSON.stringify(value);
      } catch {
        return null;
      }
    })();

    return {
      widths: count(hot.countCols()).map(col => Math.round(hot.getColWidth(col))),
      heights: count(hot.countRows()).map(row => Math.round(hot.getRowHeight(row) ?? hot.getCell(row, 0)?.offsetHeight ?? 0)),
      columnOrder: hot.columnIndexMapper.getIndexesSequence().slice(0, 20),
      rowOrder: hot.rowIndexMapper.getIndexesSequence().slice(0, 20),
      data: `${data.length}:${hash}`,
      frozen: `${settings.fixedRowsTop ?? 0},${settings.fixedColumnsStart ?? 0},${settings.fixedRowsBottom ?? 0},${settings.fixedColumnsEnd ?? 0}`,
      selected: hot.getSelected() ?? [],
      sheets,
      comment: box ? [Math.round(box.width), Math.round(box.height)] : [],
      editorText,
    };
  }, root);
}

/**
 * What changed between two drag states.
 *
 * @param before The state before.
 * @param after The state after.
 * @returns The effects, sorted.
 */
export function dragEffects(before: DragState, after: DragState): string[] {
  const differs = (field: keyof DragState) => JSON.stringify(before[field]) !== JSON.stringify(after[field]);
  const effects = new Set<string>();

  if (differs('widths') || differs('heights') || differs('comment')) {
    effects.add('resizes');
  }
  if (differs('columnOrder') || differs('rowOrder')) {
    effects.add('moves');
  }
  if (differs('data')) {
    effects.add('value-changes');
  }
  if (differs('frozen')) {
    effects.add('freezes');
  }
  if (differs('selected')) {
    effects.add('selection-changes');
  }
  if (differs('sheets')) {
    effects.add('sheet-order-changes');
  }
  // The text of an editor that stayed open; an editor that opened or closed is its own effect, so a commit
  // never reads as text the drag inserted.
  if (before.editorText !== null && after.editorText !== null && differs('editorText')) {
    effects.add('text-changes');
  }
  if (before.editorText === null && after.editorText !== null) {
    effects.add('editor-opens');
  }
  if (before.editorText !== null && after.editorText === null) {
    effects.add('editor-closes');
  }

  return [...effects].sort();
}
