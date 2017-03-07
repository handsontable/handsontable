import {getValidSelection} from './../utils';

export const KEY = 'col_right';

export default function columnRightItem() {
  return {
    key: KEY,
    name: 'Insert column on the right',

    callback(key, selection) {
      this.alter('insert_col', selection.end.col + 1, 1, 'ContextMenu.columnRight');
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
