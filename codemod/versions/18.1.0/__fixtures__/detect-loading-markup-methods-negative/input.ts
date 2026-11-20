import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector<HTMLElement>('#grid')!, { licenseKey: 'your-license-key' });
const dialog = hot.getPlugin('dialog');

// Neither call goes to the loading plugin.
dialog.show({ content: '<b>Saved</b>' });
toast.show('<b>Saved</b>');
