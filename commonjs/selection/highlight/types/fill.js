'use strict';

exports.__esModule = true;

var _src = require('./../../../3rdparty/walkontable/src');

/**
 * Creates the new instance of Selection, responsible for highlighting cells which are covered by fill handle
 * functionality. This type of selection can present on the table only one at the time.
 *
 * @return {Selection}
 */
function createHighlight() {
  var s = new _src.Selection({
    className: 'fill',
    border: {
      width: 1,
      color: '#ff0000'
    }
  });

  return s;
}

exports.default = createHighlight;