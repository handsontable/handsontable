import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), { data: [[1]], height: 'auto' });
new Handsontable(document.querySelector('#other'), { data: [[1]], height: "Auto" });

// A numeric or a percent height, and a width of auto, are not reported.
new Handsontable(document.querySelector('#third'), { data: [[1]], height: 500, width: 'auto' });
new Handsontable(document.querySelector('#fourth'), { data: [[1]], height: '100%' });

// Not an option object of a grid.
const style = { height: 'auto' };
