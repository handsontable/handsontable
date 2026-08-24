import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
/**
 * Adds appropriate CSS class to table cell, based on cellProperties.
 */
import {
  addClass,
  removeAttribute,
  removeClass,
  setAttribute
} from '../../helpers/dom/element';
import { A11Y_INVALID, A11Y_READONLY } from '../../helpers/a11y';
import { isEmpty } from '../../helpers/mixed';

export const RENDERER_TYPE: 'base' = 'base';
const TEXT_ELLIPSIS_CLASS_NAME = 'htTextEllipsis';

/**
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function baseRenderer(
  hotInstance: HotInstance, TD: HTMLTableCellElement, row: number, col: number,
  prop: string | number, value: unknown, cellProperties: CellProperties): void {
  const ariaEnabled = cellProperties.ariaTags as boolean | undefined;
  const classesToAdd: unknown[] = [];
  const classesToRemove: unknown[] = [];
  const attributesToRemove: unknown[] = [];
  const attributesToAdd: unknown[] = [];

  // Indicates that the base renderer has been called and should not be called again in TableView.cellRenderer.
  cellProperties._isBaseRendererCalled = true;

  if (cellProperties.className) {
    addClass(TD, cellProperties.className);
  }

  if (cellProperties.readOnly) {
    classesToAdd.push(cellProperties.readOnlyCellClassName);

    if (ariaEnabled) {
      attributesToAdd.push(A11Y_READONLY());
    }

  } else if (ariaEnabled) {
    attributesToRemove.push(A11Y_READONLY()[0]);
  }

  if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
    classesToAdd.push(cellProperties.invalidCellClassName);

    if (ariaEnabled) {
      attributesToAdd.push(A11Y_INVALID());
    }

  } else {
    classesToRemove.push(cellProperties.invalidCellClassName);

    if (ariaEnabled) {
      attributesToRemove.push(A11Y_INVALID()[0]);
    }
  }

  if (cellProperties.wordWrap === false && cellProperties.noWordWrapClassName) {
    classesToAdd.push(cellProperties.noWordWrapClassName);
  }

  if (isEmpty(value) && cellProperties.placeholder) {
    classesToAdd.push(cellProperties.placeholderCellClassName);
  }

  if (cellProperties.textEllipsis) {
    classesToAdd.push(TEXT_ELLIPSIS_CLASS_NAME);
  }

  removeClass(TD, classesToRemove as string[]);
  addClass(TD, classesToAdd as string[]);

  removeAttribute(TD, attributesToRemove as (string | RegExp)[]);
  setAttribute(TD, attributesToAdd as [string, string | number | boolean][]);
}

baseRenderer.RENDERER_TYPE = RENDERER_TYPE;
