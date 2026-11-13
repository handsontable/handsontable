import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { manualColumnResize: true, manualRowResize: true });
const columns = hot.getPlugin('manualColumnResize');
const rows = hot.getPlugin('manualRowResize');

hot.addHook('afterColumnResize', () => {});

// TODO(handsontable-codemod 19.0.0/resize-state-methods): Remove loadManualRowHeights() by hand: its result is used here, so the call was kept. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#removed-deprecated-apis
const widths = rows.loadManualRowHeights();

// Not a resize plugin: a store of the app.
const storage = { saveManualColumnWidths() {} };

storage.saveManualColumnWidths();
