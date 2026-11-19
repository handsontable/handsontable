import { A11Y_LABEL } from '../helpers/a11y';
import { removeAttribute, setAttribute } from '../helpers/dom/element';
import { getColumnLabel } from './columnLabel';
import type { HotInstance } from '../core/types';

/**
 * Names a form control that edits one cell, so a screen reader says which cell it edits. The name is the
 * translated phrase under `dictionaryKey`, with `[column]` replaced by the column's label (`getColumnLabel()`)
 * and `[row]` by the number the default row header shows: the row passes through the `modifyRowHeader` hook
 * first, as in `Core#getRowHeader()`, so a paged `dataProvider` grid or `bindRowsWithHeaders` names the row the
 * header next to the cell shows. With `ariaTags` off the control gets no name, like the rest of the grid's ARIA.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {HTMLElement} element The form control.
 * @param {string} dictionaryKey The phrase key, with `[column]` and `[row]` placeholders.
 * @param {number} row Visual row index.
 * @param {number} column Visual column index.
 */
export function setCellInputName(
  hot: HotInstance, element: HTMLElement, dictionaryKey: string, row: number, column: number): void {
  if (!hot.getSettings().ariaTags || row < 0 || column < 0) {
    removeAttribute(element, 'aria-label');

    return;
  }

  const name = hot.getTranslatedPhrase(dictionaryKey, {
    column: getColumnLabel(hot, column),
    row: Number(hot.runHooks('modifyRowHeader', row) ?? row) + 1,
  });

  setAttribute(element, [A11Y_LABEL(String(name ?? ''))]);
}
