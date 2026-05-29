import * as C from '../../../i18n/constants';

/**
 * @param {HiddenColumns} hiddenColumnsPlugin The plugin instance.
 * @returns {object}
 */
export default function hideColumnItem(hiddenColumnsPlugin: Record<string, Function>) {
  return {
    key: 'hidden_columns_hide',
    name(): string {
      const selection = this.getSelectedActive();
      let pluralForm = 0;

      if (Array.isArray(selection)) {
        const [, fromColumn, , toColumn] = selection;

        if (fromColumn - toColumn !== 0) {
          pluralForm = 1;
        }
      }

      return (this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_HIDE_COLUMN, pluralForm) as string);
    },
    callback() {
      const { from, to } = this.getSelectedRangeActive();
      const start = Math.max(Math.min(from.col, to.col), 0);
      const end = Math.max(from.col, to.col);
      const columnsToHide = [];

      for (let visualColumn = start; visualColumn <= end; visualColumn += 1) {
        columnsToHide.push(visualColumn);
      }

      hiddenColumnsPlugin.hideColumns(columnsToHide);

      const lastHiddenColumn = columnsToHide[columnsToHide.length - 1];
      const columnToSelect = this.columnIndexMapper.getNearestNotHiddenIndex(lastHiddenColumn, 1, true);

      if (Number.isInteger(columnToSelect) && columnToSelect >= 0) {
        this.selectColumns(columnToSelect);

      } else {
        this.deselectCell();
      }

      this.view.adjustElementsSize();
      this.render();
    },
    disabled: false,
    hidden() {
      return !(this.selection.isSelectedByColumnHeader() || this.selection.isSelectedByCorner());
    }
  };
}
