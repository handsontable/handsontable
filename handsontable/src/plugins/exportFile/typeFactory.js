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
export default function typeFactory(type, dataProvider, options) {
  if (typeof EXPORT_TYPES[type] === 'function') {
    return new EXPORT_TYPES[type](dataProvider, options);
  }

  return null;
}
