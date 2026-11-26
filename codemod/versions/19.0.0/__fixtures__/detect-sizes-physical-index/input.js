import Handsontable from 'handsontable';

new Handsontable(document.querySelector('#grid'), { data: [[1, 2]], colWidths: [100, 120], manualColumnMove: true });
new Handsontable(document.querySelector('#other'), { data: [[1, 2]], rowHeights: [20, 40] });
new Handsontable(document.querySelector('#third'), {
  data: [[1, 2]],
  minRowHeights(row) {
    return row === 0 ? 40 : 20;
  },
  colWidths: (column) => 50 + column,
});

// One size for everything is not reported, and neither is a size that is not a list or a function.
new Handsontable(document.querySelector('#fourth'), { data: [[1, 2]], colWidths: 100, rowHeights: '30px' });

// Not an option object of a grid.
const layout = { colWidths: [1, 2] };
