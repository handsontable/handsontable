'use strict';

exports.__esModule = true;

var _editors = require('./../editors');

var _renderers = require('./../renderers');

var CELL_TYPE = 'text';

exports.default = {
  editor: (0, _editors.getEditor)(CELL_TYPE),
  renderer: (0, _renderers.getRenderer)(CELL_TYPE)
};