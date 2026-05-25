import * as C from '../../../i18n/constants';
import MergedCellCoords from '../cellCoords';
import type MergedCellsCollection from '../cellsCollection';
import type { default as CellRange } from '../../../3rdparty/walkontable/src/cell/range';

/**
 * Minimal interface that toggleMergeItem requires from the MergeCells plugin.
 */
interface MergeCellsPluginRef {
  mergedCellsCollection: MergedCellsCollection;
  toggleMerge(cellRange: CellRange): void;
}

/**
 * @param {*} plugin The plugin instance.
 * @returns {object}
 */
export default function toggleMergeItem(plugin: MergeCellsPluginRef) {
  return {
    key: 'mergeCells',
    name() {
      const selection = this.getSelectedActive();

      if (selection) {
        const info = plugin.mergedCellsCollection.get(selection[0], selection[1]);

        if (info !== false && info.row === selection[0] && info.col === selection[1] &&
            info.row + info.rowspan - 1 === selection[2] && info.col + info.colspan - 1 === selection[3]) {
          return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNMERGE_CELLS);
        }
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_MERGE_CELLS);
    },
    callback() {
      const activeRange = this.getSelectedRangeActive();

      if (!activeRange) {
        return;
      }

      activeRange.setDirection(this.isRtl() ? 'NE-SW' : 'NW-SE');

      const { from, to } = activeRange;

      plugin.toggleMerge(activeRange);
      this.selectCell(from.row, from.col, to.row, to.col, false);
    },
    disabled() {
      const selection = this.getSelectedActive();

      if (!selection) {
        return true;
      }

      const isSingleCell = MergedCellCoords.isSingleCell({
        row: selection[0],
        col: selection[1],
        rowspan: selection[2] - selection[0] + 1,
        colspan: selection[3] - selection[1] + 1
      } as { rowspan: number, colspan: number });

      return isSingleCell || this.selection.isSelectedByCorner();
    },
    hidden: false
  };
}
