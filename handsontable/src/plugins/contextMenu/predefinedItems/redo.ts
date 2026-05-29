import * as C from '../../../i18n/constants';
import type { HotInstance } from '../../../core/types';

export const KEY = 'redo';

/**
 * @returns {object}
 */
export default function redoItem() {
  return {
    key: KEY,
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REDO);
    },
    callback(this: HotInstance) {
      this.getPlugin('undoRedo').redo();
    },
    hidden(this: HotInstance) {
      const undoRedoPlugin = this.getPlugin('undoRedo');

      return !undoRedoPlugin || !undoRedoPlugin.isEnabled();
    },
    disabled(this: HotInstance) {
      return !this.getPlugin('undoRedo').isRedoAvailable();
    }
  };
}
