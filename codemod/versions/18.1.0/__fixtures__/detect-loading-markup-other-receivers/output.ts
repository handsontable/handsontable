import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector<HTMLElement>('#grid')!, { licenseKey: 'your-license-key' });
const loading = hot.getPlugin('loading');
const dialog = hot.getPlugin('dialog');

// TODO(handsontable-codemod 18.1.0/loading-markup): Drop the markup and style .ht-loading__title and .ht-loading__description with CSS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#expect-markup-in-the-loading-plugins-title-and-description-to-render-as-text
loading.show({ title: 'Loading <strong>sales data</strong>' });

// These calls do not go to the loading plugin, in a file that uses it.
dialog.show({ content: '<b>Saved</b>' });
dialog.update({ content: '<i>Saved</i>' });
toast.show('<b>Saved</b>');
lightbox.update('<img src="a.png">');
hot.getPlugin('dialog').show({ content: '<b>Saved</b>' });
