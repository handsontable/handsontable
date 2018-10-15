'use strict';

exports.__esModule = true;

var _element = require('./../helpers/dom/element');

function cellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  var classesToAdd = [];
  var classesToRemove = [];

  if (cellProperties.className) {
    if (TD.className) {
      TD.className = TD.className + ' ' + cellProperties.className;
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

  if (!value && cellProperties.placeholder) {
    classesToAdd.push(cellProperties.placeholderCellClassName);
  }

  (0, _element.removeClass)(TD, classesToRemove);
  (0, _element.addClass)(TD, classesToAdd);
} /**
   * Adds appropriate CSS class to table cell, based on cellProperties
   */
exports.default = cellDecorator;