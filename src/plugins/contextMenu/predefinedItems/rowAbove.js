import {getValidSelection} from './../utils';

export const KEY = 'row_above';

export function rowAboveItem() {
  return {
    key: KEY,
    name: 'Insert row above',

    callback: function(key, selection) {
      this.alter('insert_row', selection.start.row);
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
