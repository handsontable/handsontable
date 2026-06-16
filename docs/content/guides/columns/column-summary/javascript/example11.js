import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example11');
const throwErrorsButton = document.querySelector('#throwErrorsButton');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [[0, 1, 2], ['3c', '4b', 5], [], []],
  colHeaders: true,
  rowHeaders: true,
  columnSummary: [
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 0,
      reversedRowCoords: true,
    },
    {
      type: 'sum',
      destinationRow: 0,
      destinationColumn: 1,
      reversedRowCoords: true,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
});

throwErrorsButton.addEventListener('click', () => {
  hot.updateSettings({
    columnSummary: [
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 0,
        reversedRowCoords: true,
        suppressDataTypeErrors: false,
      },
      {
        type: 'sum',
        destinationRow: 0,
        destinationColumn: 1,
        reversedRowCoords: true,
        suppressDataTypeErrors: false,
      },
    ],
  });
});
