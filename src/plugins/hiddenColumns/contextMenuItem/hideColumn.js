import {rangeEach} from 'handsontable/helpers/number';

export default function hideColumnItem(hiddenColumnsPlugin) {
  return {
    key: 'hidden_columns_hide',
    name: 'Hide column',
    callback: function() {
      let {from, to} = this.getSelectedRange();
      let start = Math.min(from.col, to.col);
      let end = Math.max(from.col, to.col);

      rangeEach(start, end, (column) => hiddenColumnsPlugin.hideColumn(column));

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);

    },
    disabled: false,
    hidden: function() {
      return !this.selection.selectedHeader.cols;
    }
  };
}
