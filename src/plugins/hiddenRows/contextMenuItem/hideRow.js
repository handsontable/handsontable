import { rangeEach } from 'handsontable/helpers/number';
import * as C from 'handsontable/i18n/constants';

export default function hideRowItem(hiddenRowsPlugin) {
  return {
    key: 'hidden_rows_hide',
    name() {
      const selection = this.getSelectedLast();
      let pluralForm = 0;

      if (Array.isArray(selection)) {
        const [fromRow, , toRow] = selection;

        if (fromRow - toRow !== 0) {
          pluralForm = 1;
        }
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_HIDE_ROW, pluralForm);
    },
    callback() {
      const { from, to } = this.getSelectedRangeLast();
      const start = Math.min(from.row, to.row);
      const end = Math.max(from.row, to.row);

      rangeEach(start, end, row => hiddenRowsPlugin.hideRow(row));

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);

    },
    disabled: false,
    hidden() {
      return !this.selection.isSelectedByRowHeader();
    }
  };
}
