import Handsontable from 'handsontable';

const elem = document.createElement('div');
const hot = new Handsontable(elem, {});

const nestedHeaders = hot.getPlugin('nestedHeaders');

nestedHeaders.enablePlugin();
nestedHeaders.disablePlugin();
nestedHeaders.updatePlugin();
