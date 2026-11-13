import Handsontable from 'handsontable';

export function save(hot, other) {
  const plugin = hot.getPlugin('exportFile');
  const base = { filename: 'trades', columnHeaders: true };
  const plain = { filename: 'trades' };

  plugin.downloadFile('csv', base);
  hot.getPlugin('ExportFile').exportAsBlob('csv', { columnHeaders: false });
  plugin.downloadFile('csv', plain);
  plugin.downloadFile('csv', other);
  other.downloadFile('csv', base);
}
