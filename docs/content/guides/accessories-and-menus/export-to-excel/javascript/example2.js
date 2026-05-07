import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import ExcelJS from 'exceljs';

registerAllModules();

const q1Data = [
  ['Alice Martin', 'North', 142000, true],
  ['Bob Chen', 'East', 98500, true],
  ['Carol Davies', 'South', 76200, false],
  ['David Kim', 'West', 115300, true],
  ['Eva Rossi', 'North', 54800, false],
];

const q2Data = [
  ['Alice Martin', 'North', 158000, true],
  ['Bob Chen', 'East', 112400, true],
  ['Carol Davies', 'South', 89100, true],
  ['David Kim', 'West', 97600, false],
  ['Eva Rossi', 'North', 63200, true],
];

const sharedConfig = {
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
  exportFile: { engines: { xlsx: ExcelJS } },
  licenseKey: 'non-commercial-and-evaluation',
};

const hotQ1 = new Handsontable(document.querySelector('#example2-q1'), {
  ...sharedConfig,
  data: q1Data,
});

const hotQ2 = new Handsontable(document.querySelector('#example2-q2'), {
  ...sharedConfig,
  data: q2Data,
});

document.querySelector('#export-sheets').addEventListener('click', async () => {
  const exportPlugin = hotQ1.getPlugin('exportFile');

  await exportPlugin.downloadFileAsync('xlsx', {
    filename: 'Annual-Sales-Report',
    sheets: [
      { instance: hotQ1, name: 'Q1 Sales', colHeaders: true, rowHeaders: true },
      { instance: hotQ2, name: 'Q2 Sales', colHeaders: true, rowHeaders: true },
    ],
  });
});
