import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example1');
const data: (string | number)[][] = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', -5, '', 12, 13],
  ['2018', '', -11, 14, 13],
  ['2019', '', 15, -12, 'readOnly']
];

function firstRowRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  td.style.fontWeight = 'bold';
  td.style.color = 'green';
  td.style.background = '#CEC';
}

function negativeValueRenderer(instance, td, row, col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);

  // if the row contains a negative number
  if (parseInt(value, 10) < 0) {
    // add class 'make-me-red'
    td.className = 'make-me-red';
  }

  if (!value || value === '') {
    td.style.background = '#EEE';

  } else {
    if (value === 'Nissan') {
      td.style.fontStyle = 'italic';
    }

    td.style.background = '';
  }
}
// maps function to a lookup string
Handsontable.renderers.registerRenderer('negativeValueRenderer', negativeValueRenderer);

const hot: Handsontable = new Handsontable(container, {
  data,
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  afterSelection(row, col, row2, col2) {
    const meta = this.getCellMeta(row2, col2);

    if (meta.readOnly) {
      this.updateSettings({ fillHandle: false });

    } else {
      this.updateSettings({ fillHandle: true });
    }
  },
  cells(row, col) {
    const cellProperties = {};
    const data = this.instance.getData();

    if (row === 0 || data[row] && data[row][col] === 'readOnly') {
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
  autoWrapCol: true
});
