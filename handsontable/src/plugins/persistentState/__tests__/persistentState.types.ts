import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  persistentState: true,
});
const plugin = hot.getPlugin('persistentState');
const valueHolder = { value: '' };

plugin.loadValue('foo', valueHolder);
plugin.saveValue('foo', 'bar');
plugin.saveValue('foo', 1);
plugin.resetValue('foo');
plugin.resetValue();
