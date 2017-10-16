import * as C from './../../../i18n/constants';

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
      return !copyPastePlugin.hot.getSelected();
    },
    hidden: false
  };
}
