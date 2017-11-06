import {rangeEach} from 'handsontable/helpers/number';
import * as C from 'handsontable/i18n/constants';

export default function hideRowItem(hiddenRowsPlugin) {
  return {
    key: 'hidden_rows_hide',
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_HIDE_ROW);
    },
    callback() {
      let {from, to} = this.getSelectedRange();
      let start = Math.min(from.row, to.row);
      let end = Math.max(from.row, to.row);

      rangeEach(start, end, (row) => hiddenRowsPlugin.hideRow(row));

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);

    },
    disabled: false,
    hidden() {
      return !this.selection.selectedHeader.rows;
    }
  };
}
