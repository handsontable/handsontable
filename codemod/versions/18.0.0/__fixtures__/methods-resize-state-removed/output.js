import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { manualColumnResize: true, manualRowResize: true });
const columns = hot.getPlugin('manualColumnResize');
const rows = hot.getPlugin('manualRowResize');

hot.addHook('afterColumnResize', () => {});

// TODO(handsontable-codemod 18.0.0/resize-state-methods): loadManualColumnWidths() is removed. Its result is used here, so the call was kept. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#stop-calling-deprecated-resize-state-methods
const widths = columns.loadManualColumnWidths();

// TODO(handsontable-codemod 18.0.0/resize-state-methods): saveManualRowHeights() is removed. It has no braces, so the call was kept. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#stop-calling-deprecated-resize-state-methods
if (widths.length)
  rows.saveManualRowHeights();

// TODO(handsontable-codemod 18.0.0/resize-state-methods): saveManualColumnWidths() is removed. Its result is used here, so the call was kept. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#stop-calling-deprecated-resize-state-methods
const persist = () => columns.saveManualColumnWidths();
const keep = columns.saveManualColumnWidths.bind(columns);

columns.saveManualColumnWidthsToServer();
