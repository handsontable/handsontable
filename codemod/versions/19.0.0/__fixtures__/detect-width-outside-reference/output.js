import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

// TODO(handsontable-codemod 19.0.0/width-outside-reference): Check this width when the height is 'auto' or unset. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#height-auto-no-longer-clips-the-grid
new Handsontable(container, { data: [[1]], width: 'var(--grid-width)' });
// TODO(handsontable-codemod 19.0.0/width-outside-reference): Check this width when the height is 'auto' or unset. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#height-auto-no-longer-clips-the-grid
new Handsontable(container, { data: [[2]], width: '50cqw' });

// Fixed widths are not reported.
new Handsontable(container, { data: [[3]], width: 600 });
new Handsontable(container, { data: [[4]], width: '40em' });
