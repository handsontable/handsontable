import * as C from './../../../i18n/constants';
import { checkSelectionBorders, markSelected } from './../utils';

export default function left(customBordersPlugin) {
  return {
    key: 'borders:left',
    name: function name() {
      var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_LEFT);
      var hasBorder = checkSelectionBorders(this, 'left');
      if (hasBorder) {
        label = markSelected(label);
      }

      return label;
    },
    callback: function callback(key, selected) {
      var hasBorder = checkSelectionBorders(this, 'left');
      customBordersPlugin.prepareBorder(selected, 'left', hasBorder);
    }
  };
}