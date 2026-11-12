import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { manualColumnResize: true, manualRowResize: true });
const columns = hot.getPlugin('manualColumnResize');
const rows = hot.getPlugin('manualRowResize');

hot.addHook('afterColumnResize', () => {});

// TODO(handsontable-codemod 18.0.0/resize-state-methods): loadManualColumnWidths() is removed. Its result is used here, so the call was kept. To keep column widths or row heights across page loads, store the columnWidths and rowHeights values yourself, for example in localStorage, and pass them back as settings when the grid initializes.
const widths = columns.loadManualColumnWidths();

// TODO(handsontable-codemod 18.0.0/resize-state-methods): saveManualRowHeights() is removed. It is the whole body of a statement without braces, so the call was kept. To keep column widths or row heights across page loads, store the columnWidths and rowHeights values yourself, for example in localStorage, and pass them back as settings when the grid initializes.
if (widths.length)
  rows.saveManualRowHeights();

// TODO(handsontable-codemod 18.0.0/resize-state-methods): saveManualColumnWidths() is removed. Its result is used here, so the call was kept. To keep column widths or row heights across page loads, store the columnWidths and rowHeights values yourself, for example in localStorage, and pass them back as settings when the grid initializes.
const persist = () => columns.saveManualColumnWidths();
const keep = columns.saveManualColumnWidths.bind(columns);

columns.saveManualColumnWidthsToServer();
