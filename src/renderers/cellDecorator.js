(function (Handsontable) {
  'use strict';

  /*
    Adds appropriate CSS class to table cell, based on cellProperties
   */
  Handsontable.renderers.cellDecorator = function (instance, TD, row, col, prop, value, cellProperties) {
    if (cellProperties.className) {
      TD.className = cellProperties.className;
    }

    if (cellProperties.readOnly) {
      instance.view.wt.wtDom.addClass(TD, cellProperties.readOnlyCellClassName);
    }

    if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
      instance.view.wt.wtDom.addClass(TD, cellProperties.invalidCellClassName);
    }

    if (cellProperties.wordWrap === false && cellProperties.noWordWrapClassName) {
      instance.view.wt.wtDom.addClass(TD, cellProperties.noWordWrapClassName);
    }

    if (!value && cellProperties.placeholder) {
      instance.view.wt.wtDom.addClass(TD, cellProperties.placeholderCellClassName);
    }
  }

})(Handsontable);