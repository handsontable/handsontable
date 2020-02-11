import { rangeEach } from '../../../helpers/number';
import * as C from '../../../i18n/constants';

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
      const start = Math.min(from.col, to.col);
      const end = Math.max(from.col, to.col);
      const columnsToHide = [];
      rangeEach(start, end, column => columnsToHide.push(column));

      const firstHiddenColumn = columnsToHide[0];
      const lastHiddenColumn = columnsToHide[columnsToHide.length - 1];
      const nextRenderableIndex = this.columnIndexMapper.getRenderableFromVisualIndex(lastHiddenColumn) + 1;
      let columnToSelect = this.columnIndexMapper.getVisualFromRenderableIndex(nextRenderableIndex);

      if (columnToSelect === null) {
        const previousRenderableIndex = this.columnIndexMapper.getRenderableFromVisualIndex(firstHiddenColumn) - 1;

        columnToSelect = this.columnIndexMapper.getVisualFromRenderableIndex(previousRenderableIndex);
      }

      hiddenColumnsPlugin.hideColumns(columnsToHide);

      if (columnToSelect !== null) {
        this.selectColumns(columnToSelect);

      } else {
        this.deselectCell();
      }

      this.render();
      this.view.wt.wtOverlays.adjustElementsSize(true);
    },
    disabled: false,
    hidden() {
      return !this.selection.isSelectedByColumnHeader();
    }
  };
}
