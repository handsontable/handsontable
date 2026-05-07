import Csv from './types/csv';
import Xlsx from './types/xlsx';

export const TYPE_CSV = 'csv';
export const TYPE_XLSX = 'xlsx';
export const TYPE_PDF = 'pdf'; // TODO

export const EXPORT_TYPES = {
  [TYPE_CSV]: Csv,
  [TYPE_XLSX]: Xlsx,
};

/**
 * @private
 * @param {string} type The exporter type.
 * @param {DataProvider} dataProvider The data provider.
 * @param {object} options Constructor options for exporter class.
 * @returns {BaseType|null}
 */
export default function typeFactory(type: string, dataProvider: Record<string, Function>, options: Record<string, unknown>) {
  if (typeof (EXPORT_TYPES as Record<string, Function>)[type] === 'function') {
    return new ((EXPORT_TYPES as Record<string, Function>)[type] as unknown as new (...args: unknown[]) => Record<string, unknown>)(dataProvider, options);
  }

  return null;
}
