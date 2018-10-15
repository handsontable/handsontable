'use strict';

exports.__esModule = true;
exports.default = bottom;

var _constants = require('./../../../i18n/constants');

var C = _interopRequireWildcard(_constants);

var _utils = require('./../utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function bottom(customBordersPlugin) {
  return {
    key: 'borders:bottom',
    name: function name() {
      var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM);
      var hasBorder = (0, _utils.checkSelectionBorders)(this, 'bottom');
      if (hasBorder) {
        label = (0, _utils.markSelected)(label);
      }
      return label;
    },
    callback: function callback(key, selected) {
      var hasBorder = (0, _utils.checkSelectionBorders)(this, 'bottom');
      customBordersPlugin.prepareBorder(selected, 'bottom', hasBorder);
    }
  };
}