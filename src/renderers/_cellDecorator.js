/**
 * Adds appropriate CSS class to table cell, based on cellProperties
 */

import {addClass, removeClass} from './../helpers/dom/element';
import {registerRenderer} from './../renderers';

export {cellDecorator};

registerRenderer('base', cellDecorator);

// support for older versions of Handsontable
Handsontable.renderers.cellDecorator = cellDecorator;

function cellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  if (cellProperties.className) {
    if(TD.className) {
      TD.className = TD.className + " " + cellProperties.className;
    } else {
      TD.className = cellProperties.className;
    }
  }

  if (cellProperties.readOnly) {
    addClass(TD, cellProperties.readOnlyCellClassName);
  }

  if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
    addClass(TD, cellProperties.invalidCellClassName);
  } else {
    removeClass(TD, cellProperties.invalidCellClassName);
  }

  if (cellProperties.wordWrap === false && cellProperties.noWordWrapClassName) {
    addClass(TD, cellProperties.noWordWrapClassName);
  }

  if (!value && cellProperties.placeholder) {
    addClass(TD, cellProperties.placeholderCellClassName);
  }
}
