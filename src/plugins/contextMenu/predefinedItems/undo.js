import {getPhrase} from './../../../i18n';
import * as C from './../../../i18n/constants';

export const KEY = 'undo';

export default function undoItem() {
  return {
    key: KEY,
    name() {
      return getPhrase(this, C.CONTEXTMENU_ITEMS_UNDO);
    },

    callback() {
      this.undo();
    },
    disabled() {
      return this.undoRedo && !this.undoRedo.isUndoAvailable();
    }
  };
}
