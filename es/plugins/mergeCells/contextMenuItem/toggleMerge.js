import * as C from '../../../i18n/constants';
import MergedCellCoords from '../cellCoords';

export default function toggleMergeItem(plugin) {
  return {
    key: 'mergeCells',
    name: function name() {
      var sel = this.getSelectedLast();

      if (sel) {
        var info = plugin.mergedCellsCollection.get(sel[0], sel[1]);

        if (info.row === sel[0] && info.col === sel[1] && info.row + info.rowspan - 1 === sel[2] && info.col + info.colspan - 1 === sel[3]) {
          return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNMERGE_CELLS);
        }
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_MERGE_CELLS);
    },
    callback: function callback() {
      plugin.toggleMergeOnSelection();
    },
    disabled: function disabled() {
      var sel = this.getSelectedLast();

      if (!sel) {
        return true;
      }

      var isSingleCell = MergedCellCoords.isSingleCell({
        row: sel[0],
        col: sel[1],
        rowspan: sel[2] - sel[0] + 1,
        colspan: sel[3] - sel[1] + 1
      });

      return isSingleCell || this.selection.isSelectedByCorner();
    },

    hidden: false
  };
}