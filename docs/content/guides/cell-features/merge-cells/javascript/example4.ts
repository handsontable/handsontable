import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example4')!;
const mergeButton = document.querySelector('#example4-merge')!;
const unmergeButton = document.querySelector('#example4-unmerge')!;

const hot = new Handsontable(container, {
  data: [
    ['North America', 420000, 465000, 501000],
    ['Europe', 388000, 402000, 411000],
    ['APAC', 275000, 298000, 312000],
    ['Latin America', 142000, 151000, 158000],
    ['Middle East', 96000, 101000, 108000],
    ['Note: Q1 totals include a one-time currency adjustment.', null, null, null],
  ],
  colHeaders: ['Region', 'Jan 2025', 'Feb 2025', 'Mar 2025'],
  rowHeaders: true,
  height: 'auto',
  contextMenu: true,
  mergeCells: true,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

mergeButton.addEventListener('click', () => {
  hot.getPlugin('mergeCells').merge(5, 0, 5, 3);
});

unmergeButton.addEventListener('click', () => {
  hot.getPlugin('mergeCells').unmerge(5, 0, 5, 3);
});
