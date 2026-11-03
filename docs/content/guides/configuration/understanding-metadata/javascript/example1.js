import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');
const output = document.querySelector('#example1-output');
const button = document.querySelector('#example1-set-reviewer');

const hot = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
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
  outsideClickDeselects: false,
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

const show = (row, col) => {
  const meta = hot.getCellMeta(row, col);

  output.textContent = [
    `Cell (${row}, ${col})`,
    `readOnly: ${meta.readOnly} (from the ${levelOf(row, col, 'readOnly')} level)`,
    `reviewer: ${meta.reviewer} (from the ${levelOf(row, col, 'reviewer')} level)`,
  ].join('\n');
};

hot.addHook('afterSelection', (row, col) => {
  if (row >= 0 && col >= 0) {
    show(row, col);
  }
});

button.addEventListener('click', () => {
  const selected = hot.getSelectedLast();

  if (!selected || selected[0] < 0 || selected[1] < 0) {
    output.textContent = 'Select a cell first.';

    return;
  }

  hot.setCellMeta(selected[0], selected[1], 'reviewer', 'Audit team');
  show(selected[0], selected[1]);
});

output.textContent = 'Select a cell to see where its values come from.';
