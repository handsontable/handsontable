import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { data: [{ id: 1 }] });

// The grid has no dataSchema, so no call changes one.
hot.updateSettings({ colHeaders: true });
