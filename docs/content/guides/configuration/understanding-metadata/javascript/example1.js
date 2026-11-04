import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');
const output = document.querySelector('#example1-output');
const status = document.querySelector('#example1-status');
const button = document.querySelector('#example1-set-reviewer');

const hot = new Handsontable(container, {
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
  data: [
    ['Ana García', 'Engineering', 'Senior Engineer'],
    ['James Okafor', 'Marketing', 'Product Manager'],
    ['Li Wei', 'Engineering', 'Staff Engineer'],
    ['Priya Nair', 'Finance', 'Financial Analyst'],
    ['Tom Becker', 'Marketing', 'Brand Designer'],
  ],
  colHeaders: ['Name', 'Department', 'Title'],
  rowHeaders: true,
  width: 'auto',
  height: 'auto',
  // keep the selection when you click the button below the grid
  outsideClickDeselects: false,
  // let the Tab key move the focus out of the grid, to the button
  tabNavigation: false,
  // grid level
  readOnly: false,
  reviewer: 'HR team',
  // column level: the Department column
  columns: [{}, { readOnly: true, reviewer: 'Finance team' }, {}],
  // cell level: one cell in the Department column
  cell: [{ row: 1, col: 1, reviewer: 'Legal team' }],
});

const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const levelOf = (row, col, key) => {
  if (has(hot.getCellMeta(row, col), key)) {
    return 'cell';
  }

  return has(hot.getColumnMeta(col), key) ? 'column' : 'grid';
};

const selectedCell = () => {
  const highlight = hot.getSelectedRangeLast()?.highlight;

  // with `navigableHeaders`, the highlight can sit on a header, which has a negative index
  if (!highlight || highlight.row === null || highlight.col === null || highlight.row < 0 || highlight.col < 0) {
    return null;
  }

  return { row: highlight.row, col: highlight.col };
};

const show = () => {
  const cell = selectedCell();

  if (!cell) {
    return;
  }

  const { row, col } = cell;
  const meta = hot.getCellMeta(row, col);

  output.textContent = [
    `Cell (${row}, ${col})`,
    `readOnly: ${meta.readOnly} (from the ${levelOf(row, col, 'readOnly')} level)`,
    `reviewer: ${meta.reviewer} (from the ${levelOf(row, col, 'reviewer')} level)`,
  ].join('\n');
};

hot.addHook('afterSelection', show);

button.addEventListener('click', () => {
  const cell = selectedCell();

  if (!cell) {
    status.textContent = 'Select a cell first.';

    return;
  }

  hot.setCellMeta(cell.row, cell.col, 'reviewer', 'Audit team');
  show();
  status.textContent = `The reviewer of cell (${cell.row}, ${cell.col}) is now Audit team.`;
});

output.textContent = 'Select a cell to see where its values come from.';
