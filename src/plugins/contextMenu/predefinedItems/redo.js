import {getPhrase} from './../../../i18n';
import * as C from './../../../i18n/constants';

export const KEY = 'redo';

export default function redoItem() {
  return {
    key: KEY,
    name() {
      return getPhrase(this, C.CONTEXTMENU_ITEMS_REDO);
    },

    callback() {
      this.redo();
    },
    disabled() {
      return this.undoRedo && !this.undoRedo.isRedoAvailable();
    }
  };
}
