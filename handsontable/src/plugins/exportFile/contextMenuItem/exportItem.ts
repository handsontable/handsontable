import { error } from '../../../helpers/console';
import {
  CONTEXTMENU_ITEMS_EXPORT,
  CONTEXTMENU_ITEMS_EXPORT_FILE_CSV,
  CONTEXTMENU_ITEMS_EXPORT_FILE_XLSX,
} from '../../../i18n/constants';
import type { ExportFile } from '../exportFile';
import { PLUGIN_KEY } from '../exportFile';
import { getExportOptions } from './utils';

/**
 * Returns the ExportFile context menu item descriptor with a submenu
 * containing "To CSV" and "To Excel" sub-items.
 *
 * The parent item is hidden when `exportFile` is not explicitly configured
 * in the Handsontable settings.
 * The "To Excel" sub-item is hidden when no XLSX engine is configured.
 *
 * @param {ExportFile} exportFilePlugin The plugin instance.
 * @returns {object}
 */
export default function exportItem(exportFilePlugin: ExportFile): object {
  return {
    key: 'export_file',
    name(): string {
      return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_EXPORT) as string;
    },
    hidden() {
      return this.getSettings()[PLUGIN_KEY] === undefined;
    },
    submenu: {
      items: [
        {
          key: 'export_file:csv',
          name(): string {
            return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_EXPORT_FILE_CSV) as string;
          },
          callback() {
            exportFilePlugin.downloadFile('csv', getExportOptions(this) as Record<string, unknown>);
          },
          disabled: false,
        },
        {
          key: 'export_file:xlsx',
          name(): string {
            return this.getTranslatedPhrase(CONTEXTMENU_ITEMS_EXPORT_FILE_XLSX) as string;
          },
          callback() {
            exportFilePlugin.downloadFileAsync(
              'xlsx', getExportOptions(this) as Record<string, unknown>
            ).catch((err) => {
              error('ExportFile: XLSX export failed.', err);
            });
          },
          hidden() {
            return !exportFilePlugin.supportsExportFormat('xlsx');
          },
        },
      ],
    },
  };
}
