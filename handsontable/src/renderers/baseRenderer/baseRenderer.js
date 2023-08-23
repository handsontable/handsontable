/**
 * Adds appropriate CSS class to table cell, based on cellProperties.
 */
import {
  addClass,
  removeAttributes,
  removeClass,
  setAttributes
} from '../../helpers/dom/element';

const ACCESSIBILITY_ATTRIBUTE_READONLY = ['aria-readonly', 'true'];
const ACCESSIBILITY_ATTRIBUTE_INVALID = ['aria-invalid', 'true'];

export const RENDERER_TYPE = 'base';

/**
 * @param {Core} instance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
 */
export function baseRenderer(instance, TD, row, col, prop, value, cellProperties) {
  const classesToAdd = [];
  const classesToRemove = [];
  const attributesToRemove = [];
  const attributesToAdd = [];

  if (cellProperties.className) {
    addClass(TD, cellProperties.className);
  }

  if (cellProperties.readOnly) {
    classesToAdd.push(cellProperties.readOnlyCellClassName);

    attributesToAdd.push(ACCESSIBILITY_ATTRIBUTE_READONLY);

  } else {
    attributesToRemove.push(ACCESSIBILITY_ATTRIBUTE_READONLY[0]);
  }

  if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
    classesToAdd.push(cellProperties.invalidCellClassName);

    attributesToAdd.push(ACCESSIBILITY_ATTRIBUTE_INVALID);

  } else {
    classesToRemove.push(cellProperties.invalidCellClassName);

    attributesToRemove.push(ACCESSIBILITY_ATTRIBUTE_INVALID[0]);
  }

  if (cellProperties.wordWrap === false && cellProperties.noWordWrapClassName) {
    classesToAdd.push(cellProperties.noWordWrapClassName);
  }

  if (!value && cellProperties.placeholder) {
    classesToAdd.push(cellProperties.placeholderCellClassName);
  }

  removeClass(TD, classesToRemove);
  addClass(TD, classesToAdd);

  removeAttributes(TD, attributesToRemove);
  setAttributes(TD, attributesToAdd);
}

baseRenderer.RENDERER_TYPE = RENDERER_TYPE;
