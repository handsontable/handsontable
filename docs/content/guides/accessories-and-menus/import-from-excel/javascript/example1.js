import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import ExcelJS from 'exceljs';

registerAllModules();

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data: [
    ['Ana García', 'Engineering', 'Senior Engineer', 98000, true, '2022-03-14'],
    ['James Okafor', 'Marketing', 'Marketing Manager', 87500, true, '2021-07-01'],
    ['Li Wei', 'Engineering', 'Product Manager', 104000, false, '2020-11-23'],
    ['Priya Nair', 'Sales', 'Account Executive', 76200, true, '2023-01-09'],
    ['Tom Bakker', 'Support', 'Support Specialist', 58900, true, '2019-05-30'],
  ],
  colHeaders: ['Name', 'Department', 'Job title', 'Salary ($)', 'Active', 'Hire date'],
  columns: [
    { type: 'text' },
    { type: 'dropdown', source: ['Engineering', 'Marketing', 'Sales', 'Support'] },
    { type: 'text' },
    { type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } },
    { type: 'checkbox' },
    { type: 'date', dateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' } },
  ],
  rowHeaders: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  importFile: { engines: { xlsx: ExcelJS } },
  licenseKey: 'non-commercial-and-evaluation',
});

const importPlugin = hot.getPlugin('importFile');
const fileInput = document.querySelector('#import-file');

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];

  if (!file) {
    return;
  }

  const result = await importPlugin.importFromBlob('xlsx', file, {
    colHeaders: 'firstRow',
  });

  console.log('Dropped features:', result.dropped);

  fileInput.value = '';
});
