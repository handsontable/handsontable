import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1, 2], [3, 4]], customBorders: true });
const borders = hot.getPlugin('customBorders');

const all = borders.getBorders();
const selected = hot.getPlugin('customBorders').getBorders([[0, 0, 1, 1]]);

// Other plugins, other receivers, and the writing methods are not reported.
const merged = hot.getPlugin('mergeCells').getBorders();
const store = { getBorders() { return []; } };

store.getBorders();
borders.setBorders([[0, 0, 1, 1]], { top: { width: 2, color: 'red' } });
