import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import ExcelJS from 'exceljs';

registerAllModules();
new Handsontable(document.querySelector('#example3'), {
  data: [
    ['Alice Martin', 'North', 142000, true],
    ['Bob Chen', 'East', 98500, true],
    ['Carol Davies', 'South', 76200, false],
    ['David Kim', 'West', 115300, true],
    ['Eva Rossi', 'North', 54800, false],
  ],
  columns: [
    { type: 'text' },
    { type: 'dropdown', source: ['North', 'South', 'East', 'West'] },
    {
      type: 'numeric',
      locale: 'en-US',
      numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
    },
    { type: 'checkbox' },
  ],
  colHeaders: ['Name', 'Region', 'Revenue ($)', 'Hit Target?'],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  contextMenu: true,
  exportFile: { engines: { xlsx: ExcelJS } },
  licenseKey: 'non-commercial-and-evaluation',
});
