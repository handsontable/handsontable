import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  themeName: 'ht-theme-main',
  data: [
    ['John Doe', 'johndoe@example.com', 'New York', 32, 'Engineer'],
    ['Jane Smith', 'janesmith@example.com', 'Los Angeles', 29, 'Designer'],
    ['Sam Wilson', 'samwilson@example.com', 'Chicago', 41, 'Manager'],
    ['Emily Johnson', 'emilyj@example.com', 'San Francisco', 35, 'Developer'],
    ['Michael Brown', 'mbrown@example.com', 'Boston', 38, 'Analyst'],
  ],
  colHeaders: ['Name', 'Email', 'City', 'Age', 'Position'],
  columns: [
    { data: 0, type: 'text' },
    { data: 1, type: 'text' },
    { data: 2, type: 'text' },
    { data: 3, type: 'numeric' },
    { data: 4, type: 'text' },
  ],
  rowHeaders: true,
  width: '100%',
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
