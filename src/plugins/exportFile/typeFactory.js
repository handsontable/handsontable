import Csv from './types/csv';

export const TYPE_CSV = 'csv';
export const TYPE_EXCEL = 'excel'; // TODO
export const TYPE_PDF = 'pdf'; // TODO

export const EXPORT_TYPES = {
  [TYPE_CSV]: Csv,
};

export default function typeFactory(type, dataProvider, options) {
  if (typeof EXPORT_TYPES[type] === 'function') {
    return new EXPORT_TYPES[type](dataProvider, options);
  }

  return null;
}
