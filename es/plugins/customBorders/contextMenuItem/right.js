import * as C from './../../../i18n/constants';
import { checkSelectionBorders, markSelected } from './../utils';

export default function right(customBordersPlugin) {
  return {
    key: 'borders:right',
    name: function name() {
      var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_RIGHT);
      var hasBorder = checkSelectionBorders(this, 'right');
      if (hasBorder) {
        label = markSelected(label);
      }
      return label;
    },
    callback: function callback(key, selected) {
      var hasBorder = checkSelectionBorders(this, 'right');
      customBordersPlugin.prepareBorder(selected, 'right', hasBorder);
    }
  };
}