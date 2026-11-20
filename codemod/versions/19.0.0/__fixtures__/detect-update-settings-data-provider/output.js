import Handsontable from 'handsontable';

const dataProvider = { fetchRows: fetchFromServer };

const hot = new Handsontable(document.querySelector('#grid'), { dataProvider });

// TODO(handsontable-codemod 19.0.0/update-settings-data-provider): Check what this updateSettings() call expects from a grid with a dataProvider. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#updatesettings-keeps-the-rows-of-a-server-backed-grid
hot.updateSettings({ data: [] });
// TODO(handsontable-codemod 19.0.0/update-settings-data-provider): Check what this updateSettings() call expects from a grid with a dataProvider. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#updatesettings-keeps-the-rows-of-a-server-backed-grid
hot.updateSettings({ dataProvider });
