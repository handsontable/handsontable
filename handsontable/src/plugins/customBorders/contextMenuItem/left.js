import * as C from '../../../i18n/constants';
import { checkSelectionBorders, markSelected } from '../utils';

/**
 * @param {CustomBorders} customBordersPlugin The plugin instance.
 * @returns {object}
 */
export default function left(customBordersPlugin) {
  const isRtl = customBordersPlugin.hot.isRtl();
  const borderDirection = isRtl ? customBordersPlugin.inlineEndProp : customBordersPlugin.inlineStartProp;

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
