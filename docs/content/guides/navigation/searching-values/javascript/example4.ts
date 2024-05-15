import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import {Search} from 'handsontable/plugins'

const container = document.querySelector('#example4');
const searchField = document.querySelector('#search_field4');
const output = document.querySelector('#output');

let searchResultCount = 0;

const data: (string | number)[][] = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'white', 'gray']
];

// define your custom callback function
function searchResultCounter(instance, row, col, value, result) {
  const DEFAULT_CALLBACK = function(instance, row, col, data, testResult) {
    instance.getCellMeta(row, col).isSearchResult = testResult;
  };

  DEFAULT_CALLBACK.apply(this, arguments);

  if (result) {
    searchResultCount++;
  }
}

const hot: Handsontable.Core = new Handsontable(container, {
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

searchField.addEventListener('keyup', (event) => {
  searchResultCount = 0;

  const search: Search = hot.getPlugin('search');
  const queryResult = search.query(event.target.value);

  console.log(queryResult);
  output.innerText = `${searchResultCount} results`;
  hot.render();
});
