import * as C from './../../../i18n/constants';

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
      const selected = this.getSelected();

      if (!selected || selected.length > 1) {
        return true;
      }

      return false;
    },
    hidden: false
  };
}
