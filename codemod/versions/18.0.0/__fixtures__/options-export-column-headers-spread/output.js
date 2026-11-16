import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]] });
const exporter = hot.getPlugin('exportFile');
const base = { columnDelimiter: ';' };

// A spread after the key can set it again, so the key stays.
// TODO(handsontable-codemod 18.0.0/export-column-headers): Rename columnHeaders to colHeaders by hand: a spread after it can set columnHeaders again and...
exporter.downloadFile('csv', { columnHeaders: false, ...overrides });

// A spread before the key can set colHeaders, which wins over columnHeaders, so the key stays too.
// TODO(handsontable-codemod 18.0.0/export-column-headers): Rename columnHeaders to colHeaders by hand: a spread before it can set colHeaders or...
exporter.downloadFile('csv', { ...overrides, columnHeaders: false });

// A spread of an object that sets neither name cannot, so the key is renamed.
exporter.downloadFile('csv', { ...base, colHeaders: false });
exporter.exportAsString('csv', { colHeaders: true });
