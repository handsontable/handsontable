'use strict';

exports.__esModule = true;

var _editors = require('./../editors');

var _renderers = require('./../renderers');

var _validators = require('./../validators');

var CELL_TYPE = 'date';

exports.default = {
  editor: (0, _editors.getEditor)(CELL_TYPE),
  // displays small gray arrow on right side of the cell
  renderer: (0, _renderers.getRenderer)('autocomplete'),
  validator: (0, _validators.getValidator)(CELL_TYPE)
};