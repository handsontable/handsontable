import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  nestedRows: true,
});
const plugin = hot.getPlugin('nestedRows');
