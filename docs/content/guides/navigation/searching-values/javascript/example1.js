import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const data = [
  ['Tesla', 2017, 'black', 'black'],
  ['Nissan', 2018, 'blue', 'blue'],
  ['Chrysler', 2019, 'yellow', 'black'],
  ['Volvo', 2020, 'yellow', 'gray'],
];

const container = document.querySelector('#example1');
const hot = new Handsontable(container, {
  data,
  colHeaders: true,
  // enable the `Search` plugin
  search: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const searchField = document.querySelector('#search_field');

// add a search input listener
searchField.addEventListener('keyup', (event) => {
  // get the `Search` plugin's instance
  const search = hot.getPlugin('search');
  // use the `Search` plugin's `query()` method
  const queryResult = search.query(event.target.value);

  console.log(queryResult);
  hot.render();
});
