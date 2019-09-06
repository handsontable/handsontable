/**
 * Adds appropriate CSS class to table cell, based on cellProperties
 */
import { addClass, removeClass } from './../helpers/dom/element';

function cellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  const classesToAdd = [];
  const classesToRemove = [];

  if (cellProperties.className) {
    if (TD.className) {
      TD.className = `${TD.className} ${cellProperties.className}`;
    } else {
      TD.className = cellProperties.className;
    }
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

  if (cellProperties.wordWrap && instance.getSettings().trimWhitespace === false) {
    // default css class (.handsontable th, .handsontable td) sets 'white-space: pre-line;' which will not break lines,
    // thus the ghost table will calculate the width wrong
    classesToAdd.push('htAllowWrap');
  }

  if (!value && cellProperties.placeholder) {
    classesToAdd.push(cellProperties.placeholderCellClassName);
  }

  removeClass(TD, classesToRemove);
  addClass(TD, classesToAdd);
}

export default cellDecorator;
