var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

import { getValidSelection } from './../utils';
import { transformSelectionToRowDistance } from './../../../selection/utils';
import * as C from './../../../i18n/constants';

export var KEY = 'remove_row';

export default function removeRowItem() {
  return {
    key: KEY,
    name: function name() {
      var selection = this.getSelected();
      var pluralForm = 0;

      if (selection) {
        if (selection.length > 1) {
          pluralForm = 1;
        } else {
          var _selection$ = _slicedToArray(selection[0], 3),
              fromRow = _selection$[0],
              toRow = _selection$[2];

          if (fromRow - toRow !== 0) {
            pluralForm = 1;
          }
        }
      }

      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_ROW, pluralForm);
    },
    callback: function callback() {
      this.alter('remove_row', transformSelectionToRowDistance(this.getSelected()), null, 'ContextMenu.removeRow');
    },
    disabled: function disabled() {
      var selected = getValidSelection(this);
      var totalRows = this.countRows();

      if (!selected) {
        return true;
      }

      return this.selection.isSelectedByColumnHeader() || this.selection.isSelectedByCorner() || !totalRows;
    },
    hidden: function hidden() {
      return !this.getSettings().allowRemoveRow;
    }
  };
}