import {getValidSelection} from './../utils';

export const KEY = 'remove_row';

export function removeRowItem() {
  return {
    key: KEY,
    name: 'Remove row',

    callback: function(key, selection) {
      let amount = selection.end.row - selection.start.row + 1;

      this.alter('remove_row', selection.start.row, amount);
    },
    disabled: function() {
      const selected = getValidSelection(this);
      const totalRows = this.countRows();

      return !selected || this.selection.selectedHeader.cols || this.selection.selectedHeader.corner || !totalRows;
    },
    hidden: function() {
      return !this.getSettings().allowRemoveRow;
    }
  };
}
