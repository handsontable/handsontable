import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { manualColumnResize: true, manualRowResize: true });
const columns = hot.getPlugin('manualColumnResize');
const rows = hot.getPlugin('manualRowResize');

hot.addHook('afterColumnResize', () => {
  columns.saveManualColumnWidths();
  rows.saveManualRowHeights();
});

columns.loadManualColumnWidths();

const widths = rows.loadManualRowHeights();

// Not a resize plugin: a store of the app.
const storage = { saveManualColumnWidths() {} };

storage.saveManualColumnWidths();
