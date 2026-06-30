import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';

/**
 * @param {CopyPaste} copyPastePlugin The plugin instance.
 * @returns {object}
 */
interface CopyPastePluginLike {
  cut(): void;
}

/**
 *
 */
export default function cutItem(copyPastePlugin: CopyPastePluginLike) {
  return {
    key: 'cut',
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_CUT) as string;
    },
    callback() {
      copyPastePlugin.cut();
    },
    disabled(this: HotInstance) {
      if (this.countRows() === 0 || this.countCols() === 0) {
        return true;
      }

      const range = this.getSelectedRangeActive();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader()) {
        return true;
      }

      const selected = this.getSelected();

      // Disable for no selection or for non-contiquous selection.
      if (!selected || selected.length > 1) {
        return true;
      }

      return false;
    },
    hidden: false
  };
}
