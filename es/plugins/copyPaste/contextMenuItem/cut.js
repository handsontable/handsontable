import * as C from './../../../i18n/constants';

export default function cutItem(copyPastePlugin) {
  return {
    key: 'cut',
    name: function name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_CUT);
    },
    callback: function callback() {
      copyPastePlugin.cut();
    },
    disabled: function disabled() {
      var selected = this.getSelected();

      if (!selected || selected.length > 1) {
        return true;
      }

      return false;
    },

    hidden: false
  };
}