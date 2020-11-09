/**
 * Adds appropriate CSS class to table cell, based on cellProperties.
 */
import { addClass, removeClass } from './../helpers/dom/element';

/**
 * @param {Core} instance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
 */
function cellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  const classesToAdd = [];
  const classesToRemove = [];

  if (cellProperties.className) {
    addClass(TD, cellProperties.className);
  }

  if (cellProperties.readOnly) {
    classesToAdd.push(cellProperties.readOnlyCellClassName);
  }

  if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
    classesToAdd.push(cellProperties.invalidCellClassName);

  } else {
    classesToRemove.push(cellProperties.invalidCellClassName);
  }

  if (cellProperties.wordWrap === false && cellProperties.noWordWrapClassName) {
    classesToAdd.push(cellProperties.noWordWrapClassName);
  }

  if (!value && cellProperties.placeholder) {
    classesToAdd.push(cellProperties.placeholderCellClassName);
  }

  removeClass(TD, classesToRemove);
  addClass(TD, classesToAdd);
}

export default cellDecorator;
