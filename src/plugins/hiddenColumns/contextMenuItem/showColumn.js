import { rangeEach } from '../../../helpers/number';
import * as C from '../../../i18n/constants';

export default function showColumnItem(hiddenColumnsPlugin) {
  const beforeHiddenColumns = [];
  const afterHiddenColumns = [];

  return {
    key: 'hidden_columns_show',
    name() {
      const selection = this.getSelectedLast();
      let pluralForm = 0;

      if (Array.isArray(selection)) {
        let [, fromColumn, , toColumn] = selection;

        if (fromColumn > toColumn) {
          [fromColumn, toColumn] = [toColumn, fromColumn];
        }

        let hiddenColumns = 0;

        if (fromColumn === toColumn) {
          hiddenColumns = beforeHiddenColumns.length + afterHiddenColumns.length;

        } else {
          rangeEach(fromColumn, toColumn, (column) => {
            if (hiddenColumnsPlugin.isHidden(column)) {
              hiddenColumns += 1;
            }
          });
        }

        pluralForm = hiddenColumns <= 1 ? 0 : 1;
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_SHOW_COLUMN, pluralForm);
    },
    callback() {
      const { from, to } = this.getSelectedRangeLast();
      const start = Math.min(from.col, to.col);
      const end = Math.max(from.col, to.col);

      if (start === end) {
        if (beforeHiddenColumns.length === start) {
          hiddenColumnsPlugin.showColumns(beforeHiddenColumns);
          beforeHiddenColumns.length = 0;
        }
        if (afterHiddenColumns.length === this.countSourceCols() - (start + 1)) {
          hiddenColumnsPlugin.showColumns(afterHiddenColumns);
          afterHiddenColumns.length = 0;
        }

      } else {
        rangeEach(start, end, column => hiddenColumnsPlugin.showColumn(column));
      }

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    disabled: false,
    hidden() {
      if (!hiddenColumnsPlugin.hiddenColumns.length || !this.selection.isSelectedByColumnHeader()) {
        return true;
      }

      beforeHiddenColumns.length = 0;
      afterHiddenColumns.length = 0;

      const { from, to } = this.getSelectedRangeLast();
      const start = Math.min(from.col, to.col);
      const end = Math.max(from.col, to.col);
      let hiddenInSelection = false;

      if (start === end) {
        let totalColumnLength = this.countSourceCols();

        rangeEach(0, totalColumnLength, (column) => {
          const partedHiddenLength = beforeHiddenColumns.length + afterHiddenColumns.length;

          if (partedHiddenLength === hiddenColumnsPlugin.hiddenColumns.length) {
            return false;
          }

          if (column < start && hiddenColumnsPlugin.isHidden(column)) {
            beforeHiddenColumns.push(column);

          } else if (hiddenColumnsPlugin.isHidden(column)) {
            afterHiddenColumns.push(column);
          }
        });

        totalColumnLength -= 1;

        if ((beforeHiddenColumns.length === start && start > 0) ||
          (afterHiddenColumns.length === totalColumnLength - start && start < totalColumnLength)) {
          hiddenInSelection = true;
        }

      } else {
        rangeEach(start, end, (column) => {
          if (hiddenColumnsPlugin.isHidden(column)) {
            hiddenInSelection = true;

            return false;
          }
        });
      }

      return !hiddenInSelection;
    }
  };
}
