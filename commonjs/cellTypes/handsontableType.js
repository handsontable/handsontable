'use strict';

exports.__esModule = true;

var _editors = require('./../editors');

var _renderers = require('./../renderers');

var CELL_TYPE = 'handsontable';

exports.default = {
  editor: (0, _editors.getEditor)(CELL_TYPE),
  // displays small gray arrow on right side of the cell
  renderer: (0, _renderers.getRenderer)('autocomplete')
};