import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example3')!;
const hot: Handsontable.Core = new Handsontable(container, {
  // top-level grid options that apply to the entire grid
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
    ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
    ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
  ],
  width: 'auto',
  height: 'auto',
  rowHeaders: true,
  colHeaders: true,
  // the `cells` options overwrite all other options
  // apply only to each cell of rows 1 and 4, as specified in the function's body
  cells(row) {
    return (row === 1 || row === 4)
      ? { readOnly: true } as Handsontable.CellMeta
      : {} as Handsontable.CellMeta;
  },
  autoWrapRow: true,
  autoWrapCol: true,
});

// check a cell's options
// returns `false`
hot.getCellMeta(0, 0).readOnly;

// returns `true`
hot.getCellMeta(0, 1).readOnly;
