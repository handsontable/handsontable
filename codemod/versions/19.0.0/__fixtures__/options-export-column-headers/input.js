import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [[1]], colHeaders: true });
const exportFile = hot.getPlugin('exportFile');

exportFile.downloadFile('csv', { columnHeaders: true, filename: 'orders' });
hot.getPlugin('exportFile').exportAsString('csv', { columnHeaders: false });

// Not the export plugin: the key means something else here.
hot.getPlugin('copyPaste').copy({ columnHeaders: true });
const report = buildReport({ columnHeaders: true });
