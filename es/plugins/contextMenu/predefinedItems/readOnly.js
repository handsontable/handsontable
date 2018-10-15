import { checkSelectionConsistency, markLabelAsSelected } from './../utils';
import { arrayEach } from './../../../helpers/array';
import * as C from './../../../i18n/constants';

export var KEY = 'make_read_only';

export default function readOnlyItem() {
  return {
    key: KEY,
    name: function name() {
      var _this = this;

      var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY);
      var atLeastOneReadOnly = checkSelectionConsistency(this.getSelectedRange(), function (row, col) {
        return _this.getCellMeta(row, col).readOnly;
      });

      if (atLeastOneReadOnly) {
        label = markLabelAsSelected(label);
      }

      return label;
    },
    callback: function callback() {
      var _this2 = this;

      var ranges = this.getSelectedRange();
      var atLeastOneReadOnly = checkSelectionConsistency(ranges, function (row, col) {
        return _this2.getCellMeta(row, col).readOnly;
      });

      arrayEach(ranges, function (range) {
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