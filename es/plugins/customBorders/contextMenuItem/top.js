import * as C from './../../../i18n/constants';
import { checkSelectionBorders, markSelected } from './../utils';

export default function top(customBordersPlugin) {
  return {
    key: 'borders:top',
    name: function name() {
      var label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_TOP);
      var hasBorder = checkSelectionBorders(this, 'top');
      if (hasBorder) {
        label = markSelected(label);
      }

      return label;
    },
    callback: function callback(key, selected) {
      var hasBorder = checkSelectionBorders(this, 'top');
      customBordersPlugin.prepareBorder(selected, 'top', hasBorder);
    }
  };
}