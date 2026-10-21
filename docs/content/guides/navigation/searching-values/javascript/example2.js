import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const data = [
  ['Hydrogen', 'H', 1, 1.008],
  ['Helium', 'He', 2, 4.003],
  ['Lithium', 'Li', 3, 6.94],
  ['Beryllium', 'Be', 4, 9.012],
  ['Boron', 'B', 5, 10.81],
];

const container = document.querySelector('#example2');

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
  // enable the `Search` plugin
  search: {
    // add your custom CSS class
    searchResultClass: 'my-class',
  },
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const searchField = document.querySelector('#search_field2');

searchField.addEventListener('keyup', (event) => {
  const search = hot.getPlugin('search');
  const queryResult = search.query(event.target.value);

  console.log(queryResult);
  hot.render();
});
