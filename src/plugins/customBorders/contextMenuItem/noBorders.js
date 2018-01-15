import * as C from './../../../i18n/constants';
import {checkSelectionBorders} from './../utils';

export default function noBorders(customBordersPlugin) {
  return {
    key: 'borders:no_borders',
    name() {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_BORDERS);
    },
    callback() {
      customBordersPlugin.prepareBorder(this.getSelectedRange(), 'noBorders');
    },
    disabled() {
      return !checkSelectionBorders(this);
    }
  };
}
