import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';
import { collectHeaderSelectedIndexes } from '../../../utils/hiddenIndexes';

/**
 * @param {HiddenColumns} hiddenColumnsPlugin The plugin instance.
 * @returns {object}
 */
export default function hideColumnItem(hiddenColumnsPlugin: Record<string, Function>) {
  return {
    key: 'hidden_columns_hide',
    name(this: HotInstance): string {
      // Every range selected by its column header counts, so a Ctrl/Cmd+click selection of two
      // single columns reads "Hide columns".
      const pluralForm = collectHeaderSelectedIndexes(this, 'col', 2).length > 1 ? 1 : 0;

      return (this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_HIDE_COLUMN, pluralForm) as string);
    },
    callback(this: HotInstance) {
      const columnsToHide = collectHeaderSelectedIndexes(this, 'col');

      if (columnsToHide.length === 0) {
        return;
      }

      hiddenColumnsPlugin.hideColumns(columnsToHide);

      const lastHiddenColumn = columnsToHide[columnsToHide.length - 1];
      const columnToSelect = this.columnIndexMapper.getNearestNotHiddenIndex(lastHiddenColumn, 1, true);

      if (columnToSelect !== null && Number.isInteger(columnToSelect) && columnToSelect >= 0) {
        this.selectColumns(columnToSelect);

      } else {
        this.deselectCell();
      }

      this.render();
    },
    disabled: false,
    hidden(this: HotInstance) {
      // Any range selected by its column header shows the item, whichever range was added last, so the
      // click order of a Ctrl/Cmd+click selection does not decide it.
      if (collectHeaderSelectedIndexes(this, 'col', 1).length === 0) {
        return true;
      }

      // Nothing to hide — no column is rendered. A corner select-all with every column already
      // hidden is the reported case (DEV-164); an empty grid is the same dead entry
      // (`hideColumns([])` hides nothing), so suppress the item whenever no column is visible.
      return this.columnIndexMapper.getRenderableIndexesLength() === 0;
    }
  };
}
