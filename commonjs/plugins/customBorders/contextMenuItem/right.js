'use strict';

exports.__esModule = true;
exports.default = right;

var _constants = require('./../../../i18n/constants');

var C = _interopRequireWildcard(_constants);

var _utils = require('./../utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function right(customBordersPlugin) {
  return {
    key: 'borders:right',
    name: function name() {
      var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_RIGHT);
      var hasBorder = (0, _utils.checkSelectionBorders)(this, 'right');
      if (hasBorder) {
        label = (0, _utils.markSelected)(label);
      }
      return label;
    },
    callback: function callback(key, selected) {
      var hasBorder = (0, _utils.checkSelectionBorders)(this, 'right');
      customBordersPlugin.prepareBorder(selected, 'right', hasBorder);
    }
  };
}