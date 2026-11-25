import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1, 2], [3, 4]], customBorders: true });
const borders = hot.getPlugin('customBorders');

// TODO(handsontable-codemod 19.0.0/custom-borders-menu-color): Check whether this code reads the color of the borders it gets. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-border-added-from-the-context-menu-takes-its-color-from-the-theme
const all = borders.getBorders();
// TODO(handsontable-codemod 19.0.0/custom-borders-menu-color): Check whether this code reads the color of the borders it gets. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-border-added-from-the-context-menu-takes-its-color-from-the-theme
const selected = hot.getPlugin('customBorders').getBorders([[0, 0, 1, 1]]);

// Other plugins, other receivers, and the writing methods are not reported.
const merged = hot.getPlugin('mergeCells').getBorders();
const store = { getBorders() { return []; } };

store.getBorders();
borders.setBorders([[0, 0, 1, 1]], { top: { width: 2, color: 'red' } });
