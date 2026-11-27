import Handsontable from 'handsontable';

const chart = { correctFormat: true, culture: 'de-DE' };
// TODO(handsontable-codemod 18.0.0/numeric-format-culture): Move numericFormat.culture to locale by hand if this object holds Handsontable options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
const payload = { columnHeaders: true, numericFormat: { culture: 'fr-FR' } };

export function render(container) {
  const grid = new Handsontable(container, { data: [], colHeaders: true });

  window.dispatchEvent(new CustomEvent('ready', { detail: { correctFormat: true } }));
  downloadFile('orders.csv', { columnHeaders: true });

  return { grid, chart, payload };
}
