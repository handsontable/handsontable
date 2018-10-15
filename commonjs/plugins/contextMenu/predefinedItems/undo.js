'use strict';

exports.__esModule = true;
exports.KEY = undefined;
exports.default = undoItem;

var _constants = require('./../../../i18n/constants');

var C = _interopRequireWildcard(_constants);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var KEY = exports.KEY = 'undo';

function undoItem() {
  return {
    key: KEY,
    name: function name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNDO);
    },
    callback: function callback() {
      this.undo();
    },
    disabled: function disabled() {
      return this.undoRedo && !this.undoRedo.isUndoAvailable();
    }
  };
}