import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example10')!;
const data: (string | number)[][] = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda', 'Mazda', 'Ford'],
  ['2017', 10, 11, 12, 13, 15, 16],
  ['2018', 10, 11, 12, 13, 15, 16],
  ['2019', 10, 11, 12, 13, 15, 16],
  ['2020', 10, 11, 12, 13, 15, 16],
  ['2021', 10, 11, 12, 13, 15, 16],
];

const settings = {
  data,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, settings);

hot.setDataAtCell(0, 1, 'Ford');
