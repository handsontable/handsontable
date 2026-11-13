import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

new Handsontable(container, { data: [[1]], width: 'var(--grid-width)' });
new Handsontable(container, { data: [[2]], width: '50cqw' });

// Fixed widths are not reported.
new Handsontable(container, { data: [[3]], width: 600 });
new Handsontable(container, { data: [[4]], width: '40em' });
