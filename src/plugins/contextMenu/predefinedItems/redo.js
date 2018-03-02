import * as C from './../../../i18n/constants';

export const KEY = 'redo';

export default function redoItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REDO);
    },
    callback() {
      this.redo();
    },
    disabled() {
      return this.undoRedo && !this.undoRedo.isRedoAvailable();
    }
  };
}
