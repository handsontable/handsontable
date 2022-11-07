import { CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY } from '../../../i18n/constants';

/**
 * @param {CopyPaste} copyPastePlugin The plugin instance.
 * @returns {object}
 */
export default function copyColumnHeadersOnlyItem(copyPastePlugin) {
  return {
    key: 'copy_column_headers_only',
    name() {
      return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_COPY_COLUMN_HEADERS_ONLY);
    },
    callback() {
      copyPastePlugin.copyColumnHeadersOnly();
    },
    disabled() {
      if (this.countRows() === 0 || this.countCols() === 0) {
        return true;
      }

      if (!this.hasColHeaders()) {
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
