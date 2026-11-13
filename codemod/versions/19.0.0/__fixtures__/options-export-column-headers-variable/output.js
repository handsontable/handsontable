import Handsontable from 'handsontable';

export function save(hot, other) {
  const plugin = hot.getPlugin('exportFile');
  const base = { filename: 'trades', columnHeaders: true };
  const plain = { filename: 'trades' };

  // TODO(handsontable-codemod 19.0.0/export-column-headers): Rename columnHeaders to colHeaders in `base` by hand: the object is passed to downloadFile()... See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#removed-deprecated-apis
  plugin.downloadFile('csv', base);
  hot.getPlugin('ExportFile').exportAsBlob('csv', { colHeaders: false });
  plugin.downloadFile('csv', plain);
  plugin.downloadFile('csv', other);
  other.downloadFile('csv', base);
}
