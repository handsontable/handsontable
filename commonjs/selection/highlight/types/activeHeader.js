'use strict';

exports.__esModule = true;

var _src = require('./../../../3rdparty/walkontable/src');

/**
 * @return {Selection}
 */
function createHighlight(_ref) {
  var activeHeaderClassName = _ref.activeHeaderClassName;

  var s = new _src.Selection({
    highlightHeaderClassName: activeHeaderClassName
  });

  return s;
}

exports.default = createHighlight;