import {rangeEach} from 'handsontable/helpers/number';

export default function showColumnItem(hiddenColumnsPlugin) {
  const beforeHiddenColumns = [];
  const afterHiddenColumns = [];

  return {
    key: 'hidden_columns_show',
    name: 'Show column',
    callback: function() {
      let {from, to} = this.getSelectedRange();
      let start = Math.min(from.col, to.col);
      let end = Math.max(from.col, to.col);

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
        rangeEach(start, end, (column) => hiddenColumnsPlugin.showColumn(column));
      }

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    disabled: false,
    hidden: function() {
      if (!hiddenColumnsPlugin.hiddenColumns.length || !this.selection.selectedHeader.cols) {
        return true;
      }

      beforeHiddenColumns.length = 0;
      afterHiddenColumns.length = 0;

      let {from, to} = this.getSelectedRange();
      let start = Math.min(from.col, to.col);
      let end = Math.max(from.col, to.col);
      let hiddenInSelection = false;

      if (start === end) {
        let totalColumnLength = this.countSourceCols();

        rangeEach(0, totalColumnLength, (column) => {
          let partedHiddenLength = beforeHiddenColumns.length + afterHiddenColumns.length;

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
