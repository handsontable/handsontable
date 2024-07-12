import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  trimRows: true,
});
new Handsontable(document.createElement('div'), {
  trimRows: [1, 2, 3],
});
const plugin = hot.getPlugin('trimRows');

plugin.trimRows([1, 2, 3]);
plugin.trimRow(1);
plugin.trimRow(1, 2, 3);
plugin.untrimRows([1, 2, 3]);
plugin.untrimRow(1);
plugin.untrimRow(1, 2, 3);
plugin.untrimAll();

const trimmedRows: number[] = plugin.getTrimmedRows();
const isTrimmed: boolean = plugin.isTrimmed(2);
const isValidConfig: boolean = plugin.isValidConfig([1, 2, 3]);
