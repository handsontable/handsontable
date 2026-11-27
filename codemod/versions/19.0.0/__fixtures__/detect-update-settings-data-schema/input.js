import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [{ id: 1, name: 'Ted' }] });

hot.updateSettings({ dataSchema: { id: null, name: null, email: null } });
// The tool does not read the arguments, so every updateSettings() call of a grid is reported in a file that sets dataSchema.
hot.updateSettings({ colHeaders: true });
