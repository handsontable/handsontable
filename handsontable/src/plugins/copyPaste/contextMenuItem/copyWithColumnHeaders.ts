import { CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS } from '../../../i18n/constants';
import { clamp } from '../../../helpers/number';

/**
 * @param {CopyPaste} copyPastePlugin The plugin instance.
 * @returns {object}
 */
interface CopyPastePluginLike {
  copyWithColumnHeaders(): void;
}

/**
 *
 */
export default function copyWithColumnHeadersItem(copyPastePlugin: CopyPastePluginLike) {
  return {
    key: 'copy_with_column_headers',
    name(): string {
      const activeSelectedRange = this.getSelectedRangeActive();
      const nounForm = activeSelectedRange ? clamp(activeSelectedRange.getWidth() - 1, 0, 1) : 0;

      return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS, nounForm) as string;
    },
    callback() {
      copyPastePlugin.copyWithColumnHeaders();
    },
    disabled() {
      if (!this.hasColHeaders()) {
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
