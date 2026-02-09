import * as C from '../../../i18n/constants';

export const KEY = 'undo';

/**
 * @returns {object}
 */
export default function undoItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNDO);
    },
    callback() {
      this.getPlugin('undoRedo').undo();
    },
    hidden() {
      const undoRedoPlugin = this.getPlugin('undoRedo');

      return !undoRedoPlugin || !undoRedoPlugin.isEnabled();
    },
    disabled() {
      return !this.getPlugin('undoRedo').isUndoAvailable();
    }
  };
}
