import Csv from './types/csv';
import Xlsx from './types/xlsx';
import type BaseType from './types/_base';
import type DataProvider from './dataProvider';

export const TYPE_CSV = 'csv';
export const TYPE_XLSX = 'xlsx';
export const TYPE_PDF = 'pdf'; // TODO

/**
 * Constructor signature shared by every exporter registered in {@link EXPORT_TYPES}.
 */
export type ExportTypeConstructor = new (
  dataProvider: DataProvider,
  options: Record<string, unknown>
) => BaseType;

export const EXPORT_TYPES: Record<string, ExportTypeConstructor> = {
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
export default function typeFactory(
  type: string, dataProvider: DataProvider, options: Record<string, unknown>
): BaseType | null {
  const ExportType = EXPORT_TYPES[type];

  if (typeof ExportType === 'function') {
    return new ExportType(dataProvider, options);
  }

  return null;
}
