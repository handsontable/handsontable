import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example1');
const buttonWithout = document.querySelector('#buttonWithout');
const buttonWith = document.querySelector('#buttonWith');
const output = document.querySelector('#output');
const data1 = [
  [1, 'Gary Nash', 'Speckled trousers', 'S', 1, 'yes'],
  [2, 'Gloria Brown', '100% Stainless sweater', 'M', 2, 'no'],
  [3, 'Ronald Carver', 'Sunny T-shirt', 'S', 1, 'no'],
  [4, 'Samuel Watkins', 'Floppy socks', 'S', 3, 'no'],
  [5, 'Stephanie Huddart', 'Bushy-bush cap', 'XXL', 1, 'no'],
  [6, 'Madeline McGillivray', 'Long skirt', 'L', 1, 'no'],
  [7, 'Jai Moor', 'Happy dress', 'XS', 1, 'no'],
  [8, 'Ben Lower', 'Speckled trousers', 'M', 1, 'no'],
  [9, 'Ali Tunbridge', 'Speckled trousers', 'M', 2, 'no'],
  [10, 'Archie Galvin', 'Regular shades', 'uni', 10, 'no'],
];

const data2 = [[11, 'Gavin Elle', 'Floppy socks', 'XS', 3, 'yes']];

const data3 = [
  [12, 'Gary Erre', 'Happy dress', 'M', 1, 'no'],
  [13, 'Anna Moon', 'Unicorn shades', 'uni', 200, 'no'],
  [14, 'Elise Eli', 'Regular shades', 'uni', 1, 'no'],
];

const hot = new Handsontable(container, {
  data: data1,
  width: 'auto',
  height: 'auto',
  colHeaders: ['ID', 'Customer name', 'Product name', 'Size', 'qty', 'Return'],
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const alterTable = () => {
  hot.alter('insert_row_above', 10, 10);
  hot.alter('insert_col_start', 6, 1);
  hot.populateFromArray(10, 0, data2);
  hot.populateFromArray(11, 0, data3);
  hot.setCellMeta(2, 2, 'className', 'green-bg');
  hot.setCellMeta(4, 2, 'className', 'green-bg');
  hot.setCellMeta(5, 2, 'className', 'green-bg');
  hot.setCellMeta(6, 2, 'className', 'green-bg');
  hot.setCellMeta(8, 2, 'className', 'green-bg');
  hot.setCellMeta(9, 2, 'className', 'green-bg');
  hot.setCellMeta(10, 2, 'className', 'green-bg');
  hot.alter('remove_col', 6, 1);
  hot.alter('remove_row', 10, 10);
  hot.setCellMeta(0, 5, 'className', 'red-bg');
  hot.setCellMeta(10, 5, 'className', 'red-bg');
  hot.render(); // Render is needed here to populate the new "className"s
};

let loggedText = '';
let counter = 0;
const logOutput = (msg) => {
  counter++;
  loggedText = `[${counter}] ${msg}\n${loggedText}`;
  output.innerText = loggedText;
};

buttonWithout.addEventListener('click', () => {
  const t1 = performance.now();

  alterTable();

  const t2 = performance.now();

  logOutput(`Time without batch ${(t2 - t1).toFixed(2)}ms`);
});
buttonWith.addEventListener('click', () => {
  const t1 = performance.now();

  hot.batch(alterTable);

  const t2 = performance.now();

  logOutput(`Time with batch ${(t2 - t1).toFixed(2)}ms`);
});
