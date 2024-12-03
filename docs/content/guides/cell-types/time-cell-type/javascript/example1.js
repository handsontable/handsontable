import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data: [
    ['Mercedes', 'A 160', 1332284400000, 6999.95],
    ['Citroen', 'C4 Coupe', '10 30', 8330],
    ['Audi', 'A4 Avant', '8:00 PM', 33900],
    ['Opel', 'Astra', 1332284400000, 7000],
    ['BMW', '320i Coupe', 1332284400000, 30500],
  ],
  colHeaders: ['Car', 'Model', 'Registration time', 'Price'],
  columnSorting: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      type: 'text',
    },
    {
      // 2nd cell is simple text, no special options here
    },
    {
      type: 'time',
      timeFormat: 'h:mm:ss a',
      correctFormat: true,
    },
    {
      type: 'numeric',
      numericFormat: {
        pattern: '$ 0,0.00',
      },
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});

hot.validateCells();
