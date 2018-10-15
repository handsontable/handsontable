import * as C from './../../../i18n/constants';

export var KEY = 'redo';

export default function redoItem() {
  return {
    key: KEY,
    name: function name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REDO);
    },
    callback: function callback() {
      this.redo();
    },
    disabled: function disabled() {
      return this.undoRedo && !this.undoRedo.isRedoAvailable();
    }
  };
}