/**
 * Adds appropriate CSS class to table cell, based on cellProperties
 */

import * as dom from './../dom.js';
import {registerRenderer} from './../renderers.js';

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
    dom.addClass(TD, cellProperties.readOnlyCellClassName);
  }

  if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
    dom.addClass(TD, cellProperties.invalidCellClassName);
  } else {
    dom.removeClass(TD, cellProperties.invalidCellClassName);
  }

  if (cellProperties.wordWrap === false && cellProperties.noWordWrapClassName) {
    dom.addClass(TD, cellProperties.noWordWrapClassName);
  }

  if (!value && cellProperties.placeholder) {
    dom.addClass(TD, cellProperties.placeholderCellClassName);
  }
}
