import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

new Handsontable(container, { data: [[1]], undo: false });

// The default and an object are not reported.
new Handsontable(container, { data: [[2]], undo: true });
new Handsontable(container, { data: [[3]], undo: { maxHistory: 50 } });

// Not an option object of the grid.
const editor = { undo: false };
