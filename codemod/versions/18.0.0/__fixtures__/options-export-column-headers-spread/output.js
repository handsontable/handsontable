import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]] });
const exporter = hot.getPlugin('exportFile');

// A spread after the key can set it again, so the key stays.
// TODO(handsontable-codemod 18.0.0/export-column-headers): Rename columnHeaders to colHeaders by hand: a spread after it can set columnHeaders again and...
exporter.downloadFile('csv', { columnHeaders: false, ...overrides });

// A spread before the key cannot override it.
exporter.downloadFile('csv', { ...overrides, colHeaders: false });
exporter.exportAsString('csv', { colHeaders: true });
