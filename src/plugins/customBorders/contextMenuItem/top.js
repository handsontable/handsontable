import * as C from './../../../i18n/constants';
import {checkSelectionBorders, markSelected} from './../utils';

export default function top(customBordersPlugin) {
  return {
    key: 'borders:top',
    name() {
      let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_TOP);
      let hasBorder = checkSelectionBorders(this, 'top');
      if (hasBorder) {
        label = markSelected(label);
      }

      return label;
    },
    callback(key, selected) {
      let hasBorder = checkSelectionBorders(this, 'top');
      customBordersPlugin.prepareBorder(selected, 'top', hasBorder);
    }
  };
}
