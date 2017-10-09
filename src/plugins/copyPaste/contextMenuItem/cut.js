import {getPhrase} from './../../../i18n';
import * as C from './../../../i18n/constants';

export default function cutItem(copyPastePlugin) {
  return {
    key: 'cut',
    name() {
      return getPhrase(this, C.CONTEXTMENU_ITEMS_CUT);
    },
    callback() {
      copyPastePlugin.setCopyableText();
      copyPastePlugin.cut(true);
    },
    disabled() {
      return !copyPastePlugin.hot.getSelected();
    },
    hidden: false
  };
}
