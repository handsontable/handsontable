import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example3')!;

new Handsontable(container, {
  data: [
    {
      id: 1,
      name: { first: 'Chris', last: 'Right' },
      password: 'plainTextPassword',
    },
    { id: 2, name: { first: 'John', last: 'Honest' }, password: 'txt' },
    { id: 3, name: { first: 'Greg', last: 'Well' }, password: 'longer' },
  ],
  colHeaders: ['ID', 'First name', 'Last name', 'Password'],
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    { data: 'id' },
    { data: 'name.first' },
    { data: 'name.last' },
    { data: 'password', type: 'password', hashSymbol: '&#9632;' },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
