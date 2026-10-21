import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const data = [
  ['Hydrogen', 'H', 1, 1.008, 7],
  ['Helium', 'He', 2, 4.003, 9],
  ['Lithium', 'Li', 3, 6.94, 9],
  ['Beryllium', '', '', '', ''],
  ['Boron', '', '', '', ''],
];

const container = document.querySelector('#example3');
const output = document.querySelector('#output');

new Handsontable(container, {
  data,
  rowHeaders: true,
  colHeaders: ['Name', 'Symbol', 'Atomic Number', 'Atomic Mass (u)', 'Known Isotopes'],
  colWidths: [80, 62, 110, 118, 110],
  stretchH: 'all',
  fillHandle: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
  beforeAutofill(selectionData) {
    // Round every filled number up to the nearest multiple of 5.
    return selectionData.map((row) =>
      row.map((value) => (typeof value === 'number' ? Math.ceil(value / 5) * 5 : value)),
    );
  },
  afterAutofill(fillData, sourceRange, targetRange, direction) {
    output.innerText =
      `Filled rows ${targetRange.from.row}-${targetRange.to.row}, ` +
      `columns ${targetRange.from.col}-${targetRange.to.col} (direction: "${direction}").`;
  },
});
