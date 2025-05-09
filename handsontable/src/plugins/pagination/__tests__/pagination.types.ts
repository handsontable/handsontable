import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  pagination: true,
});
const plugin = hot.getPlugin('pagination');
