import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { Search } from 'handsontable/plugins';

// Register all Handsontable's modules.
registerAllModules();

const data: (string | number)[][] = [
  ['Hydrogen', 'H', 1, 1.008],
  ['Helium', 'He', 2, 4.003],
  ['Lithium', 'Li', 3, 6.94],
  ['Beryllium', 'Be', 4, 9.012],
  ['Boron', 'B', 5, 10.81],
];

const container = document.querySelector('#example4')!;

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
  // enable the `Search` plugin
  search: true,
  height: 'auto',
  autoWrapRow: true,
  autoWrapCol: true,
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});

const searchField = document.querySelector('#search_field4')!;
const output = document.querySelector('#output')!;

searchField.addEventListener('keyup', (event) => {
  const search: Search = hot.getPlugin('search');
  // the default callback marks the matching cells, so they stay highlighted
  const defaultCallback = search.getCallback();
  let searchResultCount = 0;

  // pass your custom callback function: it calls the default callback and counts the matches
  const queryResult = search.query((event.target as HTMLInputElement).value, (instance, row, col, value, result) => {
    defaultCallback(instance, row, col, value, result);

    if (result) {
      searchResultCount++;
    }
  });

  console.log(queryResult);
  (output as HTMLElement).innerText = `${searchResultCount} results`;
  hot.render();
});
