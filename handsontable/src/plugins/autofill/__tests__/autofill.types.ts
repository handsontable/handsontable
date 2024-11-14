import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {
  fillHandle: true,
});

new Handsontable(elem, {
  fillHandle: 'vertical',
});

new Handsontable(elem, {
  fillHandle: 'horizontal',
});

new Handsontable(elem, {
  fillHandle: {
    autoInsertRow: false,
    direction: 'vertical'
  },
});

new Handsontable(elem, {
  fillHandle: {
    autoInsertRow: true,
    direction: 'horizontal'
  },
});

const autofill = hot.getPlugin('autofill');

autofill.enablePlugin();
autofill.disablePlugin();
autofill.updatePlugin();
