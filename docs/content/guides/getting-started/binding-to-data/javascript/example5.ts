import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example5')!;

interface Person {
  id: number;
  name?: { first: string; last: string };
  address: string;
}

const data: Person[] = [
  { id: 1, name: { first: 'Ted', last: 'Right' }, address: '' },
  { id: 2, address: '' }, // Handsontable will create missing properties on demand
  { id: 3, name: { first: 'Joan', last: 'Well' }, address: '' },
];

new Handsontable(container, {
  data,
  colHeaders: true,
  height: 'auto',
  width: 'auto',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'address' },
  ],
  minSpareRows: 1,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});
