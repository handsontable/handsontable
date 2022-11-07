import { CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS } from '../../../i18n/constants';

/**
 * @param {CopyPaste} copyPastePlugin The plugin instance.
 * @returns {object}
 */
export default function copyWithColumnHeadersItem(copyPastePlugin) {
  return {
    key: 'copy_with_column_headers',
    name() {
      return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_HEADERS);
    },
    callback() {
      copyPastePlugin.copyWithColumnHeaders();
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
