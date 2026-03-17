import { CONTEXTMENU_ITEMS_EXPORT_FILE_CSV } from '../../../i18n/constants';
import { getExportOptions } from './utils';

/**
 * Returns the ExportFile context menu item descriptor for CSV export.
 *
 * Exports the active selection when one exists and was made on data cells.
 * Falls back to exporting the entire table when there is no selection or
 * when the context menu was triggered from a header or corner element.
 *
 * @param {ExportFile} exportFilePlugin The plugin instance.
 * @returns {object}
 */
export default function exportCsvItem(exportFilePlugin) {
  return {
    key: 'export_file_csv',
    name() {
      return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_EXPORT_FILE_CSV);
    },
    callback() {
      exportFilePlugin.downloadFile('csv', getExportOptions(this));
    },
    hidden: false,
  };
}
