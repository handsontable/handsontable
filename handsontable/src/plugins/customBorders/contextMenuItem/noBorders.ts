import * as C from '../../../i18n/constants';
import { checkSelectionBorders } from '../utils';
import type { CustomBordersPlugin } from '../utils';

/**
 * @param {CustomBorders} customBordersPlugin The plugin instance.
 * @returns {object}
 */
export default function noBorders(customBordersPlugin: CustomBordersPlugin) {
  return {
    key: 'borders:no_borders',
    name(): string {
      const label: string = this.getTranslatedPhrase(C.CONTEXTMENU_ITEMS_REMOVE_BORDERS);

      return label;
    },
    callback(key: string, selected: Record<string, unknown>[]) {
      customBordersPlugin.prepareBorder(selected, 'noBorders', undefined);
    },
    disabled() {
      return !checkSelectionBorders(this);
    }
  };
}
