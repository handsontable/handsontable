import {rangeEach} from 'handsontable/helpers/number';
import * as C from 'handsontable/i18n/constants';

export default function hideColumnItem(hiddenColumnsPlugin) {
  return {
    key: 'hidden_columns_hide',
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_HIDE_COLUMN);
    },
    callback() {
      let {from, to} = this.getSelectedRange();
      let start = Math.min(from.col, to.col);
      let end = Math.max(from.col, to.col);

      rangeEach(start, end, (column) => hiddenColumnsPlugin.hideColumn(column));

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);

    },
    disabled: false,
    hidden() {
      return !this.selection.selectedHeader.cols;
    }
  };
}
