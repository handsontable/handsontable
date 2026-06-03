import type { HotInstance } from '../../../core/types';
import { CONTEXTMENU_ITEMS_COPY } from '../../../i18n/constants';

/**
 * @param {CopyPaste} copyPastePlugin The plugin instance.
 * @returns {object}
 */
interface CopyPastePluginLike {
  copyCellsOnly(): void;
}

/**
 *
 */
export default function copyItem(copyPastePlugin: CopyPastePluginLike) {
  return {
    key: 'copy',
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_COPY) as string;
    },
    callback() {
      copyPastePlugin.copyCellsOnly();
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

      // Disable for no selection or for non-contiguous selection.
      if (!selected || selected.length > 1) {
        return true;
      }

      return false;
    },
    hidden: false
  };
}
