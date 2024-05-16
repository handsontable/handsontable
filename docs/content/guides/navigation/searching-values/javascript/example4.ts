import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { Search } from 'handsontable/plugins'

let searchResultCount = 0;

const data: (string | number)[][] = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'white', 'gray']
];

// define your custom callback function
function searchResultCounter(_instance, _row, _col, _value, result) {
  const DEFAULT_CALLBACK = function(instance, row, col, _data, testResult) {
    instance.getCellMeta(row, col).isSearchResult = testResult;
  };

  DEFAULT_CALLBACK.apply(this, arguments);

  if (result) {
    searchResultCount++;
  }
}

const container = document.querySelector('#example4')!;

const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  // enable the `Search` plugin
  search: {
    // add your custom callback function
    callback: searchResultCounter
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation'
});

const searchField = document.querySelector('#search_field4')!;
const output = document.querySelector('#output')!;

searchField.addEventListener('keyup', (event) => {
  searchResultCount = 0;

  const search: Search = hot.getPlugin('search');
  const queryResult = search.query((event.target as HTMLInputElement).value);

  console.log(queryResult);
  (output as HTMLElement).innerText = `${searchResultCount} results`;
  hot.render();
});
