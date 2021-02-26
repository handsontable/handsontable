import * as C from '../../../i18n/constants';

/**
 * @param {CopyPaste} copyPastePlugin The plugin instance.
 * @returns {object}
 */
export default function copyItem(copyPastePlugin) {
  return {
    key: 'copy',
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_COPY);
    },
    callback() {
      copyPastePlugin.copy();
    },
    disabled() {
      if (this.countRows() === 0 || this.countCols() === 0) {
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
