import type { HotInstance } from '../../../core/types';
import * as C from '../../../i18n/constants';
import { checkSelectionBorders } from '../utils';
import type { CustomBordersPlugin } from '../utils';

/**
 * @param {CustomBorders} customBordersPlugin The plugin instance.
 * @returns {object}
 */
export default function left(customBordersPlugin: CustomBordersPlugin) {
  const borderDirection = customBordersPlugin.hot.isRtl() ? 'end' : 'start';

  return {
    key: 'borders:left',
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_LEFT);
    },
    checked(this: HotInstance) {
      return checkSelectionBorders(this, borderDirection);
    },
    callback(this: HotInstance, key: string, selected: Record<string, unknown>[]) {
      const hasBorder = checkSelectionBorders(this, borderDirection);

      customBordersPlugin.prepareBorder(selected, borderDirection, hasBorder);
    }
  };
}
