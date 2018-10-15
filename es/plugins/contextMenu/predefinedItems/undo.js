import * as C from './../../../i18n/constants';

export var KEY = 'undo';

export default function undoItem() {
  return {
    key: KEY,
    name: function name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNDO);
    },
    callback: function callback() {
      this.undo();
    },
    disabled: function disabled() {
      return this.undoRedo && !this.undoRedo.isUndoAvailable();
    }
  };
}