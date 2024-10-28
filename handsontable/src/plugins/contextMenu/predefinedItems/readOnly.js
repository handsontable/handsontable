import { checkSelectionConsistency, markLabelAsSelected } from '../utils';
import { arrayEach } from '../../../helpers/array';
import * as C from '../../../i18n/constants';

export const KEY = 'make_read_only';

/**
 * @returns {object}
 */
export default function readOnlyItem() {
  return {
    key: KEY,
    checkable: true,
    ariaChecked() {
      const atLeastOneReadOnly = checkSelectionConsistency(
        this.getSelectedRange(),
        (row, col) => this.getCellMeta(row, col).readOnly
      );

      return atLeastOneReadOnly;
    },

    ariaLabel() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY);
    },

    name() {
      let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_READ_ONLY);
      const atLeastOneReadOnly = checkSelectionConsistency(
        this.getSelectedRange(),
        (row, col) => this.getCellMeta(row, col).readOnly
      );

      if (atLeastOneReadOnly) {
        label = markLabelAsSelected(label);
      }

      return label;
    },
    callback() {
      const ranges = this.getSelectedRange();
      const atLeastOneReadOnly = checkSelectionConsistency(
        ranges,
        (row, col) => this.getCellMeta(row, col).readOnly
      );

      arrayEach(ranges, (range) => {
        range.forAll((row, col) => {
          if (row >= 0 && col >= 0) {
            this.setCellMeta(row, col, 'readOnly', !atLeastOneReadOnly);
          }
        });
      });

      this.render();
    },
    disabled() {
      const range = this.getSelectedRangeLast();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader()) {
        return true;
      }

      if (this.selection.isSelectedByCorner()) {
        return true;
      }

      if (this.countRows() === 0 || this.countCols() === 0) {
        return true;
      }

      if (!this.getSelectedRange() || this.getSelectedRange().length === 0) {
        return true;
      }

      return false;
    }
  };
}
