import * as C from './../../../i18n/constants';
import {checkSelectionBorders, markSelected} from './../utils';

export default function right(customBordersPlugin) {
  return {
    key: 'borders:right',
    name() {
      let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_RIGHT);
      let hasBorder = checkSelectionBorders(this, 'right');
      if (hasBorder) {
        label = markSelected(label);
      }
      return label;
    },
    callback(key, selected) {
      let hasBorder = checkSelectionBorders(this, 'right');
      customBordersPlugin.prepareBorder(selected, 'right', hasBorder);
    }
  };
}
