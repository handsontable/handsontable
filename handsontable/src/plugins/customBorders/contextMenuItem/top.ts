import * as C from '../../../i18n/constants';
import { checkSelectionBorders } from '../utils';
import type { CustomBordersPlugin } from '../utils';
import type { HotInstance } from '../../../core/types';

/**
 * @param {CustomBorders} customBordersPlugin The plugin instance.
 * @returns {object}
 */
export default function top(customBordersPlugin: CustomBordersPlugin) {
  return {
    key: 'borders:top',
    name(this: HotInstance): string {
      return this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_BORDERS_TOP);
    },
    checked(this: HotInstance) {
      return checkSelectionBorders(this, 'top');
    },
    callback(this: HotInstance, key: string, selected: Record<string, unknown>[]) {
      const hasBorder = checkSelectionBorders(this, 'top');

      customBordersPlugin.prepareBorder(selected, 'top', hasBorder);
    }
  };
}
