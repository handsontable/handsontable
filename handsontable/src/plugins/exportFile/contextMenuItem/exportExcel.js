import { isObject } from '../../../helpers/object';
import { CONTEXTMENU_ITEMS_EXPORT_FILE_XLSX } from '../../../i18n/constants';
import { PLUGIN_KEY } from '../exportFile';
import { getExportOptions } from './utils';

/**
 * Returns the ExportFile context menu item descriptor for XLSX (Excel) export.
 *
 * The item is hidden when no ExcelJS engine is configured in the plugin settings,
 * since XLSX export requires the engine to be present.
 *
 * Exports the active selection when one exists and was made on data cells.
 * Falls back to exporting the entire table when there is no selection or
 * when the context menu was triggered from a header or corner element.
 *
 * @param {ExportFile} exportFilePlugin The plugin instance.
 * @returns {object}
 */
export default function exportExcelItem(exportFilePlugin) {
  return {
    key: 'export_file_xlsx',
    name() {
      return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_EXPORT_FILE_XLSX);
    },
    callback() {
      exportFilePlugin.downloadFile('xlsx', getExportOptions(this));
    },
    hidden() {
      const settings = this.getSettings()[PLUGIN_KEY];

      return !(isObject(settings) && settings.engine);
    },
  };
}
