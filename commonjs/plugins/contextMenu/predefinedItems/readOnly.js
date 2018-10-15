'use strict';

exports.__esModule = true;
exports.KEY = undefined;
exports.default = readOnlyItem;

var _utils = require('./../utils');

var _array = require('./../../../helpers/array');

var _constants = require('./../../../i18n/constants');

var C = _interopRequireWildcard(_constants);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var KEY = exports.KEY = 'make_read_only';

function readOnlyItem() {
  return {
    key: KEY,
    name: function name() {
      var _this = this;

      var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY);
      var atLeastOneReadOnly = (0, _utils.checkSelectionConsistency)(this.getSelectedRange(), function (row, col) {
        return _this.getCellMeta(row, col).readOnly;
      });

      if (atLeastOneReadOnly) {
        label = (0, _utils.markLabelAsSelected)(label);
      }

      return label;
    },
    callback: function callback() {
      var _this2 = this;

      var ranges = this.getSelectedRange();
      var atLeastOneReadOnly = (0, _utils.checkSelectionConsistency)(ranges, function (row, col) {
        return _this2.getCellMeta(row, col).readOnly;
      });

      (0, _array.arrayEach)(ranges, function (range) {
        range.forAll(function (row, col) {
          _this2.setCellMeta(row, col, 'readOnly', !atLeastOneReadOnly);
        });
      });

      this.render();
    },
    disabled: function disabled() {
      return !(this.getSelectedRange() && !this.selection.isSelectedByCorner());
    }
  };
}