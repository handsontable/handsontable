import {getValidSelection} from './../utils';

export const KEY = 'row_below';

export default function rowBelowItem() {
  return {
    key: KEY,
    name: 'Insert row below',

    callback(key, selection) {
      this.alter('insert_row', selection.end.row + 1, 1, 'ContextMenu.rowBelow');
    },
    disabled() {
      let selected = getValidSelection(this);

      return !selected || this.selection.selectedHeader.cols || this.countRows() >= this.getSettings().maxRows;
    },
    hidden() {
      return !this.getSettings().allowInsertRow;
    }
  };
}
