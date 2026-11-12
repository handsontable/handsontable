import Handsontable from 'handsontable';

const chart = { correctFormat: true, culture: 'de-DE' };
const payload = { columnHeaders: true, numericFormat: { culture: 'fr-FR' } };

export function render(container) {
  const grid = new Handsontable(container, { data: [], colHeaders: true });

  window.dispatchEvent(new CustomEvent('ready', { detail: { correctFormat: true } }));
  downloadFile('orders.csv', { columnHeaders: true });

  return { grid, chart, payload };
}
