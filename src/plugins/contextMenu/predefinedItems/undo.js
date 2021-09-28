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
      this.undo();
    },
    hidden() {
      const undoRedo = this.getPlugin('undoRedo');

      return !undoRedo || !undoRedo.isEnabled();
    },
    disabled() {
      return !this.getPlugin('undoRedo').isUndoAvailable();
    }
  };
}
