import {getPhrase} from './../../../i18n';
import * as C from './../../../i18n/constants';

export default function copyItem(copyPastePlugin) {
  return {
    key: 'copy',
    name() {
      return getPhrase(this, C.CONTEXTMENU_ITEMS_COPY);
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
