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

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Task', 'Assignee', 'Priority', 'Status'],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  manualRowMove: true,
  licenseKey: 'non-commercial-and-evaluation',
});

// Button references
const btnAddRow = document.querySelector('#btn-add-row');
const btnDeleteRow = document.querySelector('#btn-delete-row');
const btnMoveUp = document.querySelector('#btn-move-up');
const btnMoveDown = document.querySelector('#btn-move-down');

// Track the currently selected single row (used by move buttons)
let selectedRow = null;

function updateButtonStates() {
  const hasSelection = selectedRow !== null;
  const isFirst = selectedRow === 0;
  const isLast = selectedRow === hot.countRows() - 1;

  btnDeleteRow.disabled = !hasSelection;
  btnMoveUp.disabled = !hasSelection || isFirst;
  btnMoveDown.disabled = !hasSelection || isLast;
}

// Sync button states whenever the selection changes
hot.addHook('afterSelectionEnd', (row, col, row2) => {
  // Only enable move buttons for single-row selection
  selectedRow = row === row2 ? Math.min(row, row2) : null;
  updateButtonStates();
});

hot.addHook('afterDeselect', () => {
  selectedRow = null;
  updateButtonStates();
});

// Add Row: append a blank row at the bottom
btnAddRow.addEventListener('click', () => {
  hot.alter('insert_row_below', hot.countRows() - 1);
});

// Delete Row(s): remove all rows covered by the current selection
btnDeleteRow.addEventListener('click', () => {
  const selected = hot.getSelected();

  if (!selected) {
    return;
  }

  // Collect every row index touched by any selection range
  const rowSet = new Set();

  selected.forEach(([r1, , r2]) => {
    const from = Math.min(r1, r2);
    const to = Math.max(r1, r2);

    for (let r = from; r <= to; r++) {
      rowSet.add(r);
    }
  });

  // Delete from bottom to top so earlier indices stay valid
  const rows = [...rowSet].sort((a, b) => b - a);

  rows.forEach(row => hot.alter('remove_row', row, 1));
  selectedRow = null;
  updateButtonStates();
});

// Move Up: move the selected row one position earlier
btnMoveUp.addEventListener('click', () => {
  if (selectedRow === null || selectedRow === 0) {
    return;
  }

  hot.getPlugin('manualRowMove').moveRow(selectedRow, selectedRow - 1);
  hot.render();
  selectedRow -= 1;
  hot.selectRows(selectedRow);
});

// Move Down: move the selected row one position later
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
