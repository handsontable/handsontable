import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const triggerBtn = document.querySelector('#triggerBtn');
const example = document.querySelector('#example');
const exampleParent = document.querySelector('#exampleParent');

// generate an array of arrays with dummy data
const data: string[][] = new Array(100) // number of rows
  .fill()
  .map((_, row) => new Array(50) // number of columns
    .fill()
    .map((_, column) => `${row}, ${column}`)
  );

const hot: Handsontable.Core = new Handsontable(example, {
  data,
  rowHeaders: true,
  colHeaders: true,
  width: '100%',
  height: '100%',
  rowHeights: 23,
  colWidths: 100,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation'
});

triggerBtn.addEventListener('click', () => {
  if (triggerBtn.textContent === 'Collapse container') {
    exampleParent.style.height = ''; // reset to initial 150px;
    hot.refreshDimensions();
    triggerBtn.textContent = 'Expand container';
  } else {
    exampleParent.style.height = '410px';
    hot.refreshDimensions();
    triggerBtn.textContent = 'Collapse container';
  }
});
