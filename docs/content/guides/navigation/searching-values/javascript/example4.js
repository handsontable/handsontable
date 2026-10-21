import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

let searchResultCount = 0;

const data = [
  ['Hydrogen', 'H', 1, 1.008],
  ['Helium', 'He', 2, 4.003],
  ['Lithium', 'Li', 3, 6.94],
  ['Beryllium', 'Be', 4, 9.012],
  ['Boron', 'B', 5, 10.81],
];

// define your custom callback function
function searchResultCounter(instance, row, column, value, result) {
  const DEFAULT_CALLBACK = function (instance, row, col, _data, testResult) {
    instance.getCellMeta(row, col).isSearchResult = testResult;
  };

  DEFAULT_CALLBACK.apply(this, [instance, row, column, value, result]);

  if (result) {
    searchResultCount++;
  }
}

const container = document.querySelector('#example4');

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
  // enable the `Search` plugin
  search: {
    // add your custom callback function
    callback: searchResultCounter,
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const searchField = document.querySelector('#search_field4');
const output = document.querySelector('#output');

searchField.addEventListener('keyup', (event) => {
  searchResultCount = 0;

  const search = hot.getPlugin('search');
  const queryResult = search.query(event.target.value);

  console.log(queryResult);
  output.innerText = `${searchResultCount} results`;
  hot.render();
});
