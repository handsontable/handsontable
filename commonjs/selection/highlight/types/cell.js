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
  var cellCornerVisible = _ref.cellCornerVisible;

  var s = new _src.Selection({
    className: 'current',
    border: {
      width: 2,
      color: '#4b89ff',
      cornerVisible: cellCornerVisible
    }
  });

  return s;
}

exports.default = createHighlight;