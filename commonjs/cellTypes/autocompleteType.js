'use strict';

exports.__esModule = true;

var _editors = require('./../editors');

var _renderers = require('./../renderers');

var _validators = require('./../validators');

var CELL_TYPE = 'autocomplete';

exports.default = {
  editor: (0, _editors.getEditor)(CELL_TYPE),
  renderer: (0, _renderers.getRenderer)(CELL_TYPE),
  validator: (0, _validators.getValidator)(CELL_TYPE)
};