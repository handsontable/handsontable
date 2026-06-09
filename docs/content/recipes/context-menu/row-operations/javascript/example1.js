import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  ['Migrate auth service to OAuth 2.0', 'Alice Johnson', 'High', 'In Progress'],
  ['Write API documentation', 'Bob Smith', 'Normal', 'To Do'],
  ['Fix pagination bug on dashboard', 'Carol White', 'High', 'In Review'],
  ['Add CSV export feature', 'David Lee', 'Normal', 'To Do'],
  ['Upgrade React to v19', 'Eve Martinez', 'Low', 'Backlog'],
  ['Implement dark mode toggle', 'Frank Brown', 'Normal', 'In Progress'],
  ['Set up end-to-end test suite', 'Grace Kim', 'High', 'To Do'],
  ['Refactor database connection pool', 'Henry Wilson', 'Low', 'Backlog'],
];
/* end:skip-in-preview */

const container = document.querySelector('#example1');

const toolbar = document.createElement('div');

toolbar.classList.add('example-controls-container');
toolbar.innerHTML = `
  <div class="controls">
    <button id="btn-add-row" type="button">Add Row</button>
    <button id="btn-delete-row" type="button">Delete Row</button>
    <button id="btn-move-up" type="button">Move Up</button>
    <button id="btn-move-down" type="button">Move Down</button>
  </div>
`;
container.before(toolbar);

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Task', 'Assignee', 'Priority', 'Status'],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  manualRowMove: true,
  // Keep the grid selected when clicking toolbar buttons. Without this,
  // Handsontable treats toolbar clicks as outside clicks and deselects,
  // which clears selectedRow before the button's click handler runs.
  outsideClickDeselects(target) {
    return !toolbar.contains(target);
  },
  licenseKey: 'non-commercial-and-evaluation',
});

const btnAddRow = toolbar.querySelector('#btn-add-row');
const btnDeleteRow = toolbar.querySelector('#btn-delete-row');
const btnMoveUp = toolbar.querySelector('#btn-move-up');
const btnMoveDown = toolbar.querySelector('#btn-move-down');

let selectedRow = null;

function updateButtonStates() {
  const hasSelection = selectedRow !== null;
  const isFirst = selectedRow === 0;
  const isLast = selectedRow === hot.countRows() - 1;

  btnDeleteRow.disabled = !hasSelection;
  btnMoveUp.disabled = !hasSelection || isFirst;
  btnMoveDown.disabled = !hasSelection || isLast;
}

hot.addHook('afterSelectionEnd', (row, col, row2) => {
  selectedRow = row === row2 ? Math.min(row, row2) : null;
  updateButtonStates();
});

hot.addHook('afterDeselect', () => {
  selectedRow = null;
  updateButtonStates();
});

btnAddRow.addEventListener('click', () => {
  hot.alter('insert_row_below', hot.countRows() - 1);
});

btnDeleteRow.addEventListener('click', () => {
  const selected = hot.getSelected();

  if (!selected) {
    return;
  }

  const rowSet = new Set();

  selected.forEach(([r1, , r2]) => {
    const from = Math.min(r1, r2);
    const to = Math.max(r1, r2);

    for (let r = from; r <= to; r++) {
      rowSet.add(r);
    }
  });

  const rows = [...rowSet].sort((a, b) => b - a);

  rows.forEach(row => hot.alter('remove_row', row, 1));
  updateButtonStates();
});

btnMoveUp.addEventListener('click', () => {
  if (selectedRow === null || selectedRow === 0) {
    return;
  }

  hot.getPlugin('manualRowMove').moveRow(selectedRow, selectedRow - 1);
  hot.render();
  selectedRow -= 1;
  hot.selectRows(selectedRow);
});

// ManualRowMove inserts BEFORE the target index, so moving row N down
// requires a target of N + 2 (the slot after the next row).
btnMoveDown.addEventListener('click', () => {
  if (selectedRow === null || selectedRow === hot.countRows() - 1) {
    return;
  }

  hot.getPlugin('manualRowMove').moveRow(selectedRow, selectedRow + 2);
  hot.render();
  selectedRow += 1;
  hot.selectRows(selectedRow);
});

updateButtonStates();
