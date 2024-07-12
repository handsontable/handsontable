import { CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS } from '../../../i18n/constants';
import { clamp } from '../../../helpers/number';

/**
 * @param {CopyPaste} copyPastePlugin The plugin instance.
 * @returns {object}
 */
export default function copyWithColumnGroupHeadersItem(copyPastePlugin) {
  return {
    key: 'copy_with_column_group_headers',
    name() {
      const selectedRange = this.getSelectedRangeLast();
      const nounForm = selectedRange ? clamp(selectedRange.getWidth() - 1, 0, 1) : 0;

      return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_COPY_WITH_COLUMN_GROUP_HEADERS, nounForm);
    },
    callback() {
      copyPastePlugin.copyWithAllColumnHeaders();
    },
    disabled() {
      if (!this.hasColHeaders() || !this.getSettings().nestedHeaders) {
        return true;
      }

      const range = this.getSelectedRangeLast();

      if (!range) {
        return true;
      }

      if (range.isSingleHeader()) {
        return true;
      }

      const selected = this.getSelected();

      // Disable for no selection or for non-contiguous selection.
      if (!selected || selected.length > 1) {
        return true;
      }

      return false;
    },
    hidden: false
  };
}
