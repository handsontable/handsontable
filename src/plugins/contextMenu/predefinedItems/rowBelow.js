import {getValidSelection} from './../utils';

export const KEY = 'row_below';

export function rowBelowItem() {
  return {
    key: KEY,
    name: 'Insert row below',

    callback: function(key, selection) {
      this.alter('insert_row', selection.end.row + 1);
    },
    disabled: function() {
      let selected = getValidSelection(this);

      return !selected || this.selection.selectedHeader.cols || this.countRows() >= this.getSettings().maxRows;
    },
    hidden: function() {
      return !this.getSettings().allowInsertRow;
    }
  };
}
