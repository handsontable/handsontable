import { rangeEach } from 'handsontable/helpers/number';
import * as C from 'handsontable/i18n/constants';

export default function showRowItem(hiddenRowsPlugin) {
  const beforeHiddenRows = [];
  const afterHiddenRows = [];

  return {
    key: 'hidden_rows_show',
    name() {
      const selection = this.getSelectedLast();
      let pluralForm = 0;

      if (Array.isArray(selection)) {
        let [fromRow, , toRow] = selection;

        if (fromRow > toRow) {
          [fromRow, toRow] = [toRow, fromRow];
        }

        let hiddenRows = 0;

        if (fromRow === toRow) {
          hiddenRows = beforeHiddenRows.length + afterHiddenRows.length;

        } else {
          rangeEach(fromRow, toRow, (column) => {
            if (hiddenRowsPlugin.isHidden(column)) {
              hiddenRows += 1;
            }
          });
        }

        pluralForm = hiddenRows <= 1 ? 0 : 1;
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_SHOW_ROW, pluralForm);
    },
    callback() {
      const { from, to } = this.getSelectedRangeLast();
      const start = Math.min(from.row, to.row);
      const end = Math.max(from.row, to.row);

      if (start === end) {
        if (beforeHiddenRows.length === start) {
          hiddenRowsPlugin.showRows(beforeHiddenRows);
          beforeHiddenRows.length = 0;
        }
        if (afterHiddenRows.length === this.countSourceRows() - (start + 1)) {
          hiddenRowsPlugin.showRows(afterHiddenRows);
          afterHiddenRows.length = 0;
        }

      } else {
        rangeEach(start, end, row => hiddenRowsPlugin.showRow(row));
      }

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    disabled: false,
    hidden() {
      if (!hiddenRowsPlugin.hiddenRows.length || !this.selection.isSelectedByRowHeader()) {
        return true;
      }

      beforeHiddenRows.length = 0;
      afterHiddenRows.length = 0;

      const { from, to } = this.getSelectedRangeLast();
      const start = Math.min(from.row, to.row);
      const end = Math.max(from.row, to.row);

      let hiddenInSelection = false;

      if (start === end) {
        let totalRowsLength = this.countSourceRows();

        rangeEach(0, totalRowsLength, (i) => {
          const partedHiddenLength = beforeHiddenRows.length + afterHiddenRows.length;

          if (partedHiddenLength === hiddenRowsPlugin.hiddenRows.length) {
            return false;
          }

          if (i < start) {
            if (hiddenRowsPlugin.isHidden(i)) {
              beforeHiddenRows.push(i);
            }
          } else if (hiddenRowsPlugin.isHidden(i)) {
            afterHiddenRows.push(i);
          }
        });

        totalRowsLength -= 1;

        if ((beforeHiddenRows.length === start && start > 0) ||
          (afterHiddenRows.length === totalRowsLength - start && start < totalRowsLength)) {
          hiddenInSelection = true;
        }

      } else {
        rangeEach(start, end, (i) => {
          if (hiddenRowsPlugin.isHidden(i)) {
            hiddenInSelection = true;

            return false;
          }
        });
      }

      return !hiddenInSelection;
    }
  };
}
