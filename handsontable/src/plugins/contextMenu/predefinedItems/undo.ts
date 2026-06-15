import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';

export const KEY = 'undo';

/**
 * @returns {object}
 */
export default function undoItem() {
  return {
    key: KEY,
    name(this: HotInstance): string {
      const phrase: string = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_UNDO);

      return phrase;
    },
    callback(this: HotInstance) {
      this.getPlugin('undoRedo').undo();
    },
    hidden(this: HotInstance) {
      const undoRedoPlugin = this.getPlugin('undoRedo');

      return !undoRedoPlugin || !undoRedoPlugin.isEnabled();
    },
    disabled(this: HotInstance) {
      return !this.getPlugin('undoRedo').isUndoAvailable();
    }
  };
}
