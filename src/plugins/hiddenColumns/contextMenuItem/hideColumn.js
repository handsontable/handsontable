import * as C from '../../../i18n/constants';

/**
 * @param {HiddenColumns} hiddenColumnsPlugin The plugin instance.
 * @returns {object}
 */
export default function hideColumnItem(hiddenColumnsPlugin) {
  return {
    key: 'hidden_columns_hide',
    name() {
      const selection = this.getSelectedLast();
      let pluralForm = 0;

      if (Array.isArray(selection)) {
        const [, fromColumn, , toColumn] = selection;

        if (fromColumn - toColumn !== 0) {
          pluralForm = 1;
        }
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_HIDE_COLUMN, pluralForm);
    },
    callback() {
      const { from, to } = this.getSelectedRangeLast();
      const start = Math.max(Math.min(from.col, to.col), 0);
      const end = Math.max(from.col, to.col);
      const columnsToHide = [];

      for (let visualColumn = start; visualColumn <= end; visualColumn += 1) {
        columnsToHide.push(visualColumn);
      }

      const firstHiddenColumn = columnsToHide[0];
      const lastHiddenColumn = columnsToHide[columnsToHide.length - 1];

      // Looking for a visual index on the right and then (when not found) on the left.
      const columnToSelect = this.columnIndexMapper.getFirstNotHiddenIndex(
        lastHiddenColumn + 1, 1, true, firstHiddenColumn - 1);

      hiddenColumnsPlugin.hideColumns(columnsToHide);

      if (Number.isInteger(columnToSelect) && columnToSelect >= 0) {
        this.selectColumns(columnToSelect);

      } else {
        this.deselectCell();
      }

      this.render();
      this.view.adjustElementsSize(true);
    },
    disabled: false,
    hidden() {
      return !(this.selection.isSelectedByColumnHeader() || this.selection.isSelectedByCorner());
    }
  };
}
