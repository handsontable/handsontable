'use strict';

exports.__esModule = true;
exports.default = copyItem;

var _constants = require('./../../../i18n/constants');

var C = _interopRequireWildcard(_constants);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function copyItem(copyPastePlugin) {
  return {
    key: 'copy',
    name: function name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_COPY);
    },
    callback: function callback() {
      copyPastePlugin.copy();
    },
    disabled: function disabled() {
      var selected = this.getSelected();

      if (!selected || selected.length > 1) {
        return true;
      }

      return false;
    },

    hidden: false
  };
}