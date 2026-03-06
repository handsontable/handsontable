import * as C from '../../../i18n/constants';

export const KEY = 'redo';

/**
 * @returns {object}
 */
export default function redoItem() {
  return {
    key: KEY,
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REDO);
    },
    callback() {
      this.getPlugin('undoRedo').redo();
    },
    hidden() {
      const undoRedoPlugin = this.getPlugin('undoRedo');

      return !undoRedoPlugin || !undoRedoPlugin.isEnabled();
    },
    disabled() {
      return !this.getPlugin('undoRedo').isRedoAvailable();
    }
  };
}
