var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

import { getValidSelection } from './../utils';
import * as C from './../../../i18n/constants';

export var KEY = 'col_left';

export default function columnLeftItem() {
  return {
    key: KEY,
    name: function name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_INSERT_LEFT);
    },
    callback: function callback(key, normalizedSelection) {
      var latestSelection = normalizedSelection[Math.max(normalizedSelection.length - 1, 0)];

      this.alter('insert_col', latestSelection.start.col, 1, 'ContextMenu.columnLeft');
    },
    disabled: function disabled() {
      var selected = getValidSelection(this);

      if (!selected) {
        return true;
      }
      if (!this.isColumnModificationAllowed()) {
        return true;
      }

      var _selected$ = _slicedToArray(selected[0], 3),
          startRow = _selected$[0],
          startColumn = _selected$[1],
          endRow = _selected$[2];

      var entireRowSelection = [startRow, 0, endRow, this.countCols() - 1];
      var rowSelected = entireRowSelection.join(',') === selected.join(',');
      var onlyOneColumn = this.countCols() === 1;

      return startColumn < 0 || this.countCols() >= this.getSettings().maxCols || !onlyOneColumn && rowSelected;
    },
    hidden: function hidden() {
      return !this.getSettings().allowInsertColumn;
    }
  };
}