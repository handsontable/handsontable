import * as C from './../../../i18n/constants';

export default function cutItem(copyPastePlugin) {
  return {
    key: 'cut',
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_CUT);
    },
    callback() {
      copyPastePlugin.cut();
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
