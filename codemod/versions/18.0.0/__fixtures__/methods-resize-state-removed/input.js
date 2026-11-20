import Handsontable from 'handsontable';

const hot = new Handsontable(document.querySelector('#grid'), { manualColumnResize: true, manualRowResize: true });
const columns = hot.getPlugin('manualColumnResize');
const rows = hot.getPlugin('manualRowResize');

hot.addHook('afterColumnResize', () => {
  columns.saveManualColumnWidths();
  rows.saveManualRowHeights();
});

// restore the sizes on load
columns.loadManualColumnWidths();
await rows.loadManualRowHeights();
hot.getPlugin('manualRowResize')?.saveManualRowHeights(); // persist

const widths = columns.loadManualColumnWidths();

if (widths.length) rows.saveManualRowHeights();

const persist = () => columns.saveManualColumnWidths();
const keep = columns.saveManualColumnWidths.bind(columns);

columns.saveManualColumnWidthsToServer();
