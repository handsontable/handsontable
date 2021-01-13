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
      this.redo();
    },
    hidden() {
      return !this.getPlugin('undoRedo');
    },
    disabled() {
      const undoRedo = this.getPlugin('undoRedo');

      return !undoRedo.isEnabled() || !undoRedo.isRedoAvailable();
    }
  };
}
