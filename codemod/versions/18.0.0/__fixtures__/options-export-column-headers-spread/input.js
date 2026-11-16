import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]] });
const exporter = hot.getPlugin('exportFile');

// A spread after the key can set it again, so the key stays.
exporter.downloadFile('csv', { columnHeaders: false, ...overrides });

// A spread before the key cannot override it.
exporter.downloadFile('csv', { ...overrides, columnHeaders: false });
exporter.exportAsString('csv', { columnHeaders: true });
