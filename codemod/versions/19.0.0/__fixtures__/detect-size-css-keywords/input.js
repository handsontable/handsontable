import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

new Handsontable(container, { data: [[1]], width: 'fit-content', height: 'inherit' });
new Handsontable(container, { data: [[2]], width: 'stretch', height: '-webkit-fill-available' });
new Handsontable(container, { data: [[3]], width: 'FIT-CONTENT(200px)' });

// Valid sizes are not reported.
new Handsontable(container, { data: [[4]], width: '100%', height: 'auto' });
new Handsontable(container, { data: [[5]], width: 600, height: '50vh' });

// Not an option object of the grid.
const box = { width: 'fit-content' };
