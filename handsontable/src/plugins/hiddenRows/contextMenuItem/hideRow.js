import * as C from '../../../i18n/constants';

/**
 * @param {HiddenRows} hiddenRowsPlugin The plugin instance.
 * @returns {object}
 */
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
      const start = Math.max(Math.min(from.row, to.row), 0);
      const end = Math.max(from.row, to.row);
      const rowsToHide = [];

      for (let visualRow = start; visualRow <= end; visualRow += 1) {
        rowsToHide.push(visualRow);
      }

      hiddenRowsPlugin.hideRows(rowsToHide);

      const lastHiddenRow = rowsToHide[rowsToHide.length - 1];
      const rowToSelect = this.rowIndexMapper.getNearestNotHiddenIndex(lastHiddenRow, 1, true);

      if (Number.isInteger(rowToSelect) && rowToSelect >= 0) {
        this.selectRows(rowToSelect);

      } else {
        this.deselectCell();
      }

      this.render();
      this.view.adjustElementsSize();
    },
    disabled: false,
    hidden() {
      return !(this.selection.isSelectedByRowHeader() || this.selection.isSelectedByCorner());
    }
  };
}
