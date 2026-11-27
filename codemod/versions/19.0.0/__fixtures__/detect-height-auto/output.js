import Handsontable from 'handsontable';

// TODO(handsontable-codemod 19.0.0/height-auto): Check what the page does with this height: 'auto' grid. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#height-auto-no-longer-clips-the-grid
new Handsontable(document.querySelector('#grid'), { data: [[1]], height: 'auto' });
// TODO(handsontable-codemod 19.0.0/height-auto): Check what the page does with this height: 'auto' grid. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#height-auto-no-longer-clips-the-grid
new Handsontable(document.querySelector('#other'), { data: [[1]], height: "Auto" });

// A numeric or a percent height, and a width of auto, are not reported.
new Handsontable(document.querySelector('#third'), { data: [[1]], height: 500, width: 'auto' });
new Handsontable(document.querySelector('#fourth'), { data: [[1]], height: '100%' });

// Not an option object of a grid.
const style = { height: 'auto' };
