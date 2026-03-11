import * as C from '../../../i18n/constants';

/**
 * Create the "Export to Excel" context menu item definition.
 *
 * @param {ExportToExcel} plugin The ExportToExcel plugin instance.
 * @returns {object}
 */
export default function exportToExcelItem(plugin) {
  return {
    key: 'exportToExcel',
    name() {
      return this.getTranslatedPhrase(
        C.CONTEXTMENU_ITEMS_EXPORT_TO_EXCEL
      );
    },
    callback() {
      const selection = this.getSelectedActive();
      const options = {};

      if (selection) {
        options.range = [
          selection[0],
          selection[1],
          selection[2],
          selection[3],
        ];
      }

      plugin.downloadFile(options);
    },
    disabled: false,
    hidden: false,
  };
}
