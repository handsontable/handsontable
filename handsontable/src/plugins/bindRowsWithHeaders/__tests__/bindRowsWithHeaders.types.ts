import Handsontable from 'handsontable';

new Handsontable(document.createElement('div'), {
  bindRowsWithHeaders: true,
});
new Handsontable(document.createElement('div'), {
  bindRowsWithHeaders: 'loose',
});
new Handsontable(document.createElement('div'), {
  bindRowsWithHeaders: 'strict',
});
