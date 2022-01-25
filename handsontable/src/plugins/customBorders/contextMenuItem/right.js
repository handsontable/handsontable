import * as C from '../../../i18n/constants';
import { checkSelectionBorders, markSelected } from '../utils';

/**
 * @param {CustomBorders} customBordersPlugin The plugin instance.
 * @returns {object}
 */
export default function right(customBordersPlugin) {
  const borderDirection = customBordersPlugin.hot.isRtl() ? 'start': 'end';

  return {
    key: 'borders:right',
    name() {
      let label = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_RIGHT);
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
