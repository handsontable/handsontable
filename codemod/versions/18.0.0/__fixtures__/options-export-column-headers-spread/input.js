import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]] });
const exporter = hot.getPlugin('exportFile');
const base = { columnDelimiter: ';' };

// A spread after the key can set it again, so the key stays.
exporter.downloadFile('csv', { columnHeaders: false, ...overrides });

// A spread before the key can set colHeaders, which wins over columnHeaders, so the key stays too.
exporter.downloadFile('csv', { ...overrides, columnHeaders: false });

// A spread of an object that sets neither name cannot, so the key is renamed.
exporter.downloadFile('csv', { ...base, columnHeaders: false });
exporter.exportAsString('csv', { columnHeaders: true });
