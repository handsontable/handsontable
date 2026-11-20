import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

// TODO(handsontable-codemod 19.0.0/undo-false): Check this undo: false setting. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#undo-and-redo-restore-a-recorded-state
new Handsontable(container, { data: [[1]], undo: false });

// The default and an object are not reported.
new Handsontable(container, { data: [[2]], undo: true });
new Handsontable(container, { data: [[3]], undo: { maxHistory: 50 } });

// Not an option object of the grid.
const editor = { undo: false };
