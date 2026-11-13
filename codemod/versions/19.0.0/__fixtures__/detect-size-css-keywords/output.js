import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

// TODO(handsontable-codemod 19.0.0/size-css-keywords): Replace this width or height with 'auto', a length, or '100%'. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#height-auto-no-longer-clips-the-grid
new Handsontable(container, { data: [[1]], width: 'fit-content', height: 'inherit' });
// TODO(handsontable-codemod 19.0.0/size-css-keywords): Replace this width or height with 'auto', a length, or '100%'. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#height-auto-no-longer-clips-the-grid
new Handsontable(container, { data: [[2]], width: 'stretch', height: '-webkit-fill-available' });
// TODO(handsontable-codemod 19.0.0/size-css-keywords): Replace this width or height with 'auto', a length, or '100%'. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#height-auto-no-longer-clips-the-grid
new Handsontable(container, { data: [[3]], width: 'FIT-CONTENT(200px)' });

// Valid sizes are not reported.
new Handsontable(container, { data: [[4]], width: '100%', height: 'auto' });
new Handsontable(container, { data: [[5]], width: 600, height: '50vh' });

// Not an option object of the grid.
const box = { width: 'fit-content' };
