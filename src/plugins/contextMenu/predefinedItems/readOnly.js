import { checkSelectionConsistency, markLabelAsSelected } from './../utils';
import { arrayEach } from './../../../helpers/array';
import * as C from './../../../i18n/constants';

export const KEY = 'make_read_only';

export default function readOnlyItem() {
  return {
    key: KEY,
    name() {
      let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY);
      const atLeastOneReadOnly = checkSelectionConsistency(this.getSelectedRange(), (row, col) => this.getCellMeta(row, col).readOnly);

      if (atLeastOneReadOnly) {
        label = markLabelAsSelected(label);
      }

      return label;
    },
    callback() {
      const ranges = this.getSelectedRange();
      const atLeastOneReadOnly = checkSelectionConsistency(ranges, (row, col) => this.getCellMeta(row, col).readOnly);

      arrayEach(ranges, (range) => {
        range.forAll((row, col) => {
          this.setCellMeta(row, col, 'readOnly', !atLeastOneReadOnly);
        });
      });

      this.render();
    },
    disabled() {
      return !(this.getSelectedRange() && !this.selection.isSelectedByCorner());
    }
  };
}
