import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [{ id: 1, name: 'Ted' }] });

// TODO(handsontable-codemod 19.0.0/update-settings-data-schema): Check whether this updateSettings() call changes dataSchema on a grid that sets no columns. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#changing-dataschema-resets-the-grids-index-state
hot.updateSettings({ dataSchema: { id: null, name: null, email: null } });
// The tool does not read the arguments, so every updateSettings() call of a grid is reported in a file that sets dataSchema.
// TODO(handsontable-codemod 19.0.0/update-settings-data-schema): Check whether this updateSettings() call changes dataSchema on a grid that sets no columns. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#changing-dataschema-resets-the-grids-index-state
hot.updateSettings({ colHeaders: true });
