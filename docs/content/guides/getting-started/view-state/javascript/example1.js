import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1');
const saveButton = document.querySelector('#save');
const restoreButton = document.querySelector('#restore');
const output = document.querySelector('#output');

// The saved view is plain JSON, so you can keep it in a variable, `localStorage`, or on a server.
let savedView = null;

const hot = new Handsontable(container, {
  data: [
    ['Laptop Pro 14', 'Computers', 1499, 24, 4.7],
    ['Wireless Mouse', 'Accessories', 29, 310, 4.4],
    ['Mechanical Keyboard', 'Accessories', 119, 85, 4.8],
    ['4K Monitor 27"', 'Displays', 449, 41, 4.6],
    ['USB-C Dock', 'Accessories', 189, 67, 4.2],
    ['Tablet Air 11', 'Computers', 599, 52, 4.5],
    ['Webcam HD', 'Accessories', 79, 140, 4.1],
    ['Ultrawide Monitor 34"', 'Displays', 799, 18, 4.9],
  ],
  colHeaders: ['Product', 'Category', 'Price', 'Stock', 'Rating'],
  rowHeaders: true,
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  contextMenu: true,
  hiddenColumns: { indicators: true },
  manualColumnResize: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});

saveButton.addEventListener('click', () => {
  savedView = JSON.stringify(hot.getPlugin('viewState').getViewState());
  output.textContent = 'View saved';
});

restoreButton.addEventListener('click', () => {
  if (savedView === null) {
    output.textContent = 'Save a view first';

    return;
  }

  const { skipped } = hot.getPlugin('viewState').setViewState(JSON.parse(savedView));

  output.textContent =
    skipped.length === 0
      ? 'View restored'
      : `View restored, skipped: ${skipped.map(({ part, reason }) => `${part} (${reason})`).join(', ')}`;
});
