import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const autofill = hot.getPlugin('autofill');

autofill.enablePlugin();
autofill.disablePlugin();
autofill.updatePlugin();
