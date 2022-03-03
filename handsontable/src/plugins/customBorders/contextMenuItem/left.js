import * as C from '../../../i18n/constants';
import { checkSelectionBorders, markSelected } from '../utils';

/**
 * @param {CustomBorders} customBordersPlugin The plugin instance.
 * @returns {object}
 */
export default function left(customBordersPlugin) {
  const borderDirection = customBordersPlugin.hot.isRtl() ? 'end' : 'start';

  return {
    key: 'borders:left',
    name() {
      let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_LEFT);
      const hasBorder = checkSelectionBorders(this, borderDirection);

      if (hasBorder) {
        label = markSelected(label);
      }

      return label;
    },
    callback(key, selected) {
      const hasBorder = checkSelectionBorders(this, borderDirection);

      customBordersPlugin.prepareBorder(selected, borderDirection, hasBorder);
    }
  };
}
