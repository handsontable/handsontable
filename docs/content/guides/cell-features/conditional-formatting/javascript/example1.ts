import Handsontable from 'handsontable';
import { BaseRenderer } from 'handsontable/renderers';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const data: (string | number)[][] = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', -5, '', 12, 13],
  ['2018', '', -11, 14, 13],
  ['2019', '', 15, -12, 'readOnly'],
];

const firstRowRenderer: BaseRenderer = (instance, td, ...rest) => {
  Handsontable.renderers.TextRenderer(instance, td, ...rest);
  td.style.fontWeight = 'bold';
  td.style.color = 'green';
  td.style.background = '#CEC';
};

const negativeValueRenderer: BaseRenderer = (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties
) => {
  Handsontable.renderers.TextRenderer(
    instance,
    td,
    row,
    col,
    prop,
    value,
    cellProperties
  );

  // if the row contains a negative number
  if (parseInt(value, 10) < 0) {
    // add class 'make-me-red'
    td.className = 'make-me-red';
  }

  if (!value || value === '') {
    td.style.background = 'rgb(238, 238, 238, 0.4)';
  } else {
    if (instance.getDataAtCell(0, col) === 'Nissan') {
      td.style.fontStyle = 'italic';
    }

    td.style.background = '';
  }
};

// maps function to a lookup string
Handsontable.renderers.registerRenderer(
  'negativeValueRenderer',
  negativeValueRenderer
);

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data,
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  afterSelection(_row, _col, row2, col2) {
    const meta = (this as unknown as Handsontable.Core).getCellMeta(row2, col2);

    if (meta.readOnly) {
      (this as unknown as Handsontable.Core).updateSettings({
        fillHandle: false,
      });
    } else {
      (this as unknown as Handsontable.Core).updateSettings({
        fillHandle: true,
      });
    }
  },
  cells(row, col) {
    const cellProperties: Handsontable.CellMeta = {};
    const data = this.instance.getData();

    if (row === 0 || (data[row] && data[row][col] === 'readOnly')) {
      cellProperties.readOnly = true; // make cell read-only if it is first row or the text reads 'readOnly'
    }

    if (row === 0) {
      cellProperties.renderer = firstRowRenderer; // uses function directly
    } else {
      cellProperties.renderer = 'negativeValueRenderer'; // uses lookup map
    }

    return cellProperties;
  },
  autoWrapRow: true,
  autoWrapCol: true,
});
