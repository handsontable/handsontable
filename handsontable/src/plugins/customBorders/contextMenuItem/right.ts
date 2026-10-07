import * as C from '../../../i18n/constants';
import { checkSelectionBorders } from '../utils';
import type { CustomBordersPlugin } from '../utils';
import type { HotInstance } from '../../../core/types';

/**
 * @param {CustomBorders} customBordersPlugin The plugin instance.
 * @returns {object}
 */
export default function right(customBordersPlugin: CustomBordersPlugin) {
  const borderDirection = customBordersPlugin.hot.isRtl() ? 'start' : 'end';

  return {
    key: 'borders:right',
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_RIGHT);
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
