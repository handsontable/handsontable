import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#exampleExcludeRowsFromSorting');
const hot = new Handsontable(container, {
  data: [
    {
      brand: 'Brand',
      model: 'Model',
      price: 'Price',
      sellDate: 'Date',
      sellTime: 'Time',
      inStock: 'In stock',
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: 11,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: 0,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: 1,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: 3,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: 5,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: 22,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: 13,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: 0,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: 'Oct 2, 2023',
      sellTime: '13:23 AM',
      inStock: 14,
    },
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: 16,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: 'May 3, 2023',
      sellTime: '11:27 AM',
      inStock: 18,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: 'Mar 27, 2023',
      sellTime: '03:17 AM',
      inStock: 3,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: 'Aug 28, 2023',
      sellTime: '08:01 AM',
      inStock: 0,
    },
    {
      brand: 'Vinte',
      model: 'ML Road Frame-W',
      price: 30,
      sellDate: 'Oct 11, 2023',
      sellTime: '01:23 AM',
      inStock: 2,
    },
    {},
  ],
  columns: [
    {
      type: 'text',
      data: 'brand',
    },
    {
      type: 'text',
      data: 'model',
    },
    {
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$ 0,0.00',
        culture: 'en-US',
      },
    },
    {
      type: 'date',
      data: 'sellDate',
      dateFormat: 'MMM D, YYYY',
      correctFormat: true,
      className: 'htRight',
    },
    {
      type: 'time',
      data: 'sellTime',
      timeFormat: 'hh:mm A',
      correctFormat: true,
      className: 'htRight',
    },
    {
      type: 'numeric',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  height: 200,
  stretchH: 'all',
  fixedRowsTop: 1,
  fixedRowsBottom: 1,
  colHeaders: true,
  columnSorting: true,
  // `afterColumnSort()` is a Handsontable hook: it's fired after each sorting
  afterColumnSort() {
    const lastRowIndex = hot.countRows() - 1;

    // after each sorting, take row 1 and change its index to 0
    hot.rowIndexMapper.moveIndexes(hot.toVisualRow(0), 0);
    // after each sorting, take row 16 and change its index to 15
    hot.rowIndexMapper.moveIndexes(hot.toVisualRow(lastRowIndex), lastRowIndex);
  },
  cells(row) {
    const lastRowIndex = this.instance.countRows() - 1;

    if (row === 0) {
      return {
        type: 'text',
        className: 'htCenter',
        readOnly: true,
      };
    }

    if (row === lastRowIndex) {
      return {
        type: 'numeric',
        className: 'htCenter',
      };
    }

    return {
      type: 'text',
    };
  },
  columnSummary: [
    {
      sourceColumn: 2,
      type: 'sum',
      reversedRowCoords: true,
      destinationRow: 0,
      destinationColumn: 2,
      forceNumeric: true,
      suppressDataTypeErrors: true,
    },
    {
      sourceColumn: 5,
      type: 'sum',
      reversedRowCoords: true,
      destinationRow: 0,
      destinationColumn: 5,
      forceNumeric: true,
      suppressDataTypeErrors: true,
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
