'use strict';

exports.__esModule = true;

var _src = require('./../../../3rdparty/walkontable/src');

/**
 * Creates the new instance of Selection responsible for highlighting currently selected cell. This type of selection
 * can present on the table only one at the time.
 *
 * @return {Selection}
 */
function createHighlight(_ref) {
  var border = _ref.border,
      cellRange = _ref.cellRange;

  var s = new _src.Selection(border, cellRange);

  return s;
}

exports.default = createHighlight;