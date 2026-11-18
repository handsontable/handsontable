import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';
import { collectHeaderSelectedIndexes } from '../../../utils/hiddenIndexes';

/**
 * @param {HiddenRows} hiddenRowsPlugin The plugin instance.
 * @returns {object}
 */
export default function hideRowItem(hiddenRowsPlugin: Record<string, Function>) {
  return {
    key: 'hidden_rows_hide',
    name(this: HotInstance): string {
      // Every range selected by its row header counts, so a Ctrl/Cmd+click selection of two single
      // rows reads "Hide rows".
      const pluralForm = collectHeaderSelectedIndexes(this, 'row', 2).length > 1 ? 1 : 0;

      return (this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_HIDE_ROW, pluralForm) as string);
    },
    callback(this: HotInstance) {
      const rowsToHide = collectHeaderSelectedIndexes(this, 'row');

      if (rowsToHide.length === 0) {
        return;
      }

      hiddenRowsPlugin.hideRows(rowsToHide);

      const lastHiddenRow = rowsToHide[rowsToHide.length - 1];
      const rowToSelect = this.rowIndexMapper.getNearestNotHiddenIndex(lastHiddenRow, 1, true);

      if (rowToSelect !== null && Number.isInteger(rowToSelect) && rowToSelect >= 0) {
        this.selectRows(rowToSelect);

      } else {
        this.deselectCell();
      }

      this.render();
    },
    disabled: false,
    hidden(this: HotInstance) {
      // Any range selected by its row header shows the item, whichever range was added last, so the
      // click order of a Ctrl/Cmd+click selection does not decide it.
      if (collectHeaderSelectedIndexes(this, 'row', 1).length === 0) {
        return true;
      }

      // Nothing to hide — no row is rendered. A corner select-all with every row already hidden is
      // the reported case (DEV-164), but an empty or fully-trimmed grid is the same dead entry
      // (`hideRows([])` hides nothing), so suppress the item whenever no row is visible.
      return this.rowIndexMapper.getRenderableIndexesLength() === 0;
    }
  };
}
