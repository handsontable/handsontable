'use strict';

exports.__esModule = true;
exports.default = noBorders;

var _constants = require('./../../../i18n/constants');

var C = _interopRequireWildcard(_constants);

var _utils = require('./../utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function noBorders(customBordersPlugin) {
  return {
    key: 'borders:no_borders',
    name: function name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_BORDERS);
    },
    callback: function callback(key, selected) {
      customBordersPlugin.prepareBorder(selected, 'noBorders');
    },
    disabled: function disabled() {
      return !(0, _utils.checkSelectionBorders)(this);
    }
  };
}