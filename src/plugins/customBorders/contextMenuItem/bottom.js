import * as C from './../../../i18n/constants';
import { checkSelectionBorders, markSelected } from './../utils';

export default function bottom(customBordersPlugin) {
  return {
    key: 'borders:bottom',
    name() {
      let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_BOTTOM);
      const hasBorder = checkSelectionBorders(this, 'bottom');
      if (hasBorder) {
        label = markSelected(label);
      }
      return label;
    },
    callback(key, selected) {
      const hasBorder = checkSelectionBorders(this, 'bottom');
      customBordersPlugin.prepareBorder(selected, 'bottom', hasBorder);
    }
  };
}
