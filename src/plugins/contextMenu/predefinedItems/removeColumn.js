import {getValidSelection} from './../utils';

export const KEY = 'remove_col';

export function removeColumnItem() {
  return {
    key: KEY,
    name: 'Remove column',

    callback: function(key, selection) {
      let amount = selection.end.col - selection.start.col + 1;

      this.alter('remove_col', selection.start.col, amount);

    },
    disabled: function() {
      const selected = getValidSelection(this);
      const totalColumns = this.countCols();

      return !selected || this.selection.selectedHeader.rows || this.selection.selectedHeader.corner ||
             !this.isColumnModificationAllowed() || !totalColumns;
    },
    hidden: function() {
      return !this.getSettings().allowRemoveColumn;
    }
  };
}
