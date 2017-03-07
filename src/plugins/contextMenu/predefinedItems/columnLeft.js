import {getValidSelection} from './../utils';

export const KEY = 'col_left';

export default function columnLeftItem() {
  return {
    key: KEY,
    name: 'Insert column on the left',
    callback(key, selection) {
      this.alter('insert_col', selection.start.col, 1, 'ContextMenu.columnLeft');
    },
    disabled() {
      let selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      if (!this.isColumnModificationAllowed()) {
        return true;
      }
      let entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1];
      let rowSelected = entireRowSelection.join(',') == selected.join(',');
      let onlyOneColumn = this.countCols() === 1;

      return selected[1] < 0 || this.countCols() >= this.getSettings().maxCols || (!onlyOneColumn && rowSelected);
    },
    hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}
