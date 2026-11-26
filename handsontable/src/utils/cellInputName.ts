import { A11Y_LABEL } from '../helpers/a11y';
import { removeAttribute, setAttribute } from '../helpers/dom/element';
import {
  COMMENTS_EDITOR_LABEL,
  COMMENTS_EDITOR_LABEL_ROW_HEADER,
  EDITOR_INPUT_LABEL,
  EDITOR_INPUT_LABEL_ROW_HEADER,
} from '../i18n/constants';
import { getColumnLabel, getRowLabel } from './headerLabel';
import type { HotInstance } from '../core/types';

/**
 * The two phrases a cell input is named with: `numbered` reads `[row]` as a row number (`row 3`), `labelled`
 * reads it as the text of a custom row header (`Q3`).
 */
export interface CellInputPhrases {
  numbered: string;
  labelled: string;
}

/**
 * The phrases of a cell editor's input.
 */
export const CELL_EDITOR_PHRASES: CellInputPhrases = {
  numbered: EDITOR_INPUT_LABEL,
  labelled: EDITOR_INPUT_LABEL_ROW_HEADER,
};

/**
 * The phrases of the comment editor's text field.
 */
export const COMMENT_EDITOR_PHRASES: CellInputPhrases = {
  numbered: COMMENTS_EDITOR_LABEL,
  labelled: COMMENTS_EDITOR_LABEL_ROW_HEADER,
};

/**
 * The name this module last wrote on each control. A control whose `aria-label` differs from it was named by the
 * application (a custom editor), and keeps that name.
 */
const writtenNames = new WeakMap<HTMLElement, string>();

/**
 * Tells whether the application named the control itself: an `aria-labelledby`, which this module never writes,
 * or an `aria-label` other than the one this module wrote last.
 *
 * @param {HTMLElement} element The form control.
 * @returns {boolean}
 */
function isNamedByApplication(element: HTMLElement): boolean {
  const label = element.getAttribute('aria-label');

  return element.hasAttribute('aria-labelledby') || (label !== null && label !== writtenNames.get(element));
}

/**
 * Names a form control that edits one cell, so a screen reader says which cell it edits. The name is a translated
 * phrase with `[column]` replaced by the column's label (`getColumnLabel()`) and `[row]` by the row's label
 * (`getRowLabel()`): the number the default row header shows reads through `phrases.numbered` (`Age, row 3`), the
 * text of a custom row header through `phrases.labelled` (`Age, Q3`). A control the application named itself
 * (an `aria-label` this function did not write, or an `aria-labelledby`) is left as it is. With `ariaTags` off, or
 * for a header coordinate, the function removes the name it wrote and nothing else.
 *
 * @param {HotInstance} hot The Handsontable instance.
 * @param {HTMLElement} element The form control.
 * @param {CellInputPhrases} phrases The phrase keys, with `[column]` and `[row]` placeholders.
 * @param {number} row Visual row index.
 * @param {number} column Visual column index.
 */
export function setCellInputName(
  hot: HotInstance, element: HTMLElement, phrases: CellInputPhrases, row: number, column: number): void {
  if (isNamedByApplication(element)) {
    return;
  }

  if (!hot.getSettings().ariaTags || row < 0 || column < 0) {
    if (writtenNames.has(element)) {
      removeAttribute(element, 'aria-label');
      writtenNames.delete(element);
    }

    return;
  }

  const rowLabel = getRowLabel(hot, row);
  const name = String(hot.getTranslatedPhrase(typeof rowLabel === 'number' ? phrases.numbered : phrases.labelled, {
    column: getColumnLabel(hot, column),
    row: rowLabel,
  }) ?? '');

  setAttribute(element, [A11Y_LABEL(name)]);
  writtenNames.set(element, name);
}
