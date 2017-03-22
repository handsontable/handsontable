import {getValidSelection} from './../utils';

export const KEY = 'remove_col';

export default function removeColumnItem() {
  return {
    key: KEY,
    name: 'Remove column',

    callback(key, selection) {
      let amount = selection.end.col - selection.start.col + 1;

      this.alter('remove_col', selection.start.col, amount, 'ContextMenu.removeColumn');

    },
    disabled() {
      const selected = getValidSelection(this);
      const totalColumns = this.countCols();

      return !selected || this.selection.selectedHeader.rows || this.selection.selectedHeader.corner ||
             !this.isColumnModificationAllowed() || !totalColumns;
    },
    hidden() {
      return !this.getSettings().allowRemoveColumn;
    }
  };
}
