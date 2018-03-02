import * as C from '../../../i18n/constants';

export default function toggleMergeItem(plugin) {
  return {
    key: 'mergeCells',
    name() {
      const sel = this.getSelectedLast();
      const info = plugin.mergedCellsCollection.get(sel[0], sel[1]);

      if (info.row === sel[0] && info.col === sel[1] && info.row + info.rowspan - 1 === sel[2] && info.col + info.colspan - 1 === sel[3]) {
        return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNMERGE_CELLS);
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_MERGE_CELLS);
    },
    callback() {
      plugin.toggleMerge(this.getSelectedRangeLast());
      this.render();
    },
    disabled() {
      return this.selection.selectedHeader.corner;
    },
    hidden: false
  };
}
