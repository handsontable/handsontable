import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Acme Corp', 4.2, 5.1, -1.3, 6.8],
  ['Vertex Industries', 12.5, 11.9, 13.2, 14],
  ['Harbor Analytics', -2.4, 0.8, 2.1, 3.5],
  ['Summit Logistics', 8.7, -3.2, 4.4, 5.9],
  ['Pioneer Foods', 1.1, 1.4, 0.9, -0.5],
  ['Meridian Retail', 6, 7.3, 8.1, 9.4],
];

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data,
  colHeaders: ['Company', 'Q1', 'Q2', 'Q3', 'Q4'],
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  columns: [
    { className: 'company-name' },
    { type: 'numeric' },
    { type: 'numeric' },
    { type: 'numeric' },
    { type: 'numeric' },
  ],
  cells(row, col) {
    const cellProperties: Handsontable.CellMeta = {};

    if (col > 0) {
      cellProperties.className = '';

      const value = this.instance.getDataAtCell(row, col);

      if (typeof value === 'number' && value < 0) {
        cellProperties.className = 'loss';
      } else if (typeof value === 'number' && value > 10) {
        cellProperties.className = 'strong-quarter';
      }
    }

    return cellProperties;
  },
});
