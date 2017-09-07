import {rangeEach} from 'handsontable/helpers/number';

export default function showRowItem(hiddenRowsPlugin) {
  const beforeHiddenRows = [];
  const afterHiddenRows = [];

  return {
    key: 'hidden_rows_show',
    name: 'Show row',
    callback: function() {
      let {from, to} = this.getSelectedRange();
      let start = Math.min(from.row, to.row);
      let end = Math.max(from.row, to.row);

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
        rangeEach(start, end, (row) => hiddenRowsPlugin.showRow(row));
      }

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    disabled: false,
    hidden: function() {
      if (!hiddenRowsPlugin.hiddenRows.length || !this.selection.selectedHeader.rows) {
        return true;
      }

      beforeHiddenRows.length = 0;
      afterHiddenRows.length = 0;

      let {from, to} = this.getSelectedRange();
      let start = Math.min(from.row, to.row);
      let end = Math.max(from.row, to.row);

      let hiddenInSelection = false;

      if (start === end) {
        let totalRowsLength = this.countSourceRows();

        rangeEach(0, totalRowsLength, (i) => {
          let partedHiddenLength = beforeHiddenRows.length + afterHiddenRows.length;

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
