import {getValidSelection} from './../utils';

export const KEY = 'clear_column';

export default function clearColumnItem() {
  return {
    key: KEY,
    name: 'Clear column',

    callback(key, selection) {
      let column = selection.start.col;

      if (this.countRows()) {
        this.populateFromArray(0, column, [[null]], Math.max(selection.start.row, selection.end.row), column, 'ContextMenu.clearColumn');
      }
    },
    disabled() {
      let selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      let entireRowSelection = [selected[0], 0, selected[0], this.countCols() - 1];
      let rowSelected = entireRowSelection.join(',') == selected.join(',');

      return selected[1] < 0 || this.countCols() >= this.getSettings().maxCols || rowSelected;
    }
  };
}
