import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector<HTMLElement>('#grid')!, { licenseKey: 'your-license-key' });
const loading = hot.getPlugin('loading');
const dialog = hot.getPlugin('dialog');

loading.show({ title: 'Loading <strong>sales data</strong>' });

// These calls do not go to the loading plugin, in a file that uses it.
dialog.show({ content: '<b>Saved</b>' });
dialog.update({ content: '<i>Saved</i>' });
toast.show('<b>Saved</b>');
lightbox.update('<img src="a.png">');
hot.getPlugin('dialog').show({ content: '<b>Saved</b>' });
