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

export const RENDERER_TYPE = 'base';

/**
 * @param {Core} hotInstance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
 */
export function baseRenderer(hotInstance, TD, row, col, prop, value, cellProperties) {
  const ariaEnabled = cellProperties.ariaTags;
  const classesToAdd = [];
  const classesToRemove = [];
  const attributesToRemove = [];
  const attributesToAdd = [];

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

  if (!value && cellProperties.placeholder) {
    classesToAdd.push(cellProperties.placeholderCellClassName);
  }

  removeClass(TD, classesToRemove);
  addClass(TD, classesToAdd);

  removeAttribute(TD, attributesToRemove);
  setAttribute(TD, attributesToAdd);
}

baseRenderer.RENDERER_TYPE = RENDERER_TYPE;
