import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  ['Hannah Schmidt', 'Product manager', 'Platform', 'Berlin'],
  ['Kenji Watanabe', 'Backend engineer', 'Platform', 'Tokyo'],
  ['Sofia Rossi', 'UX designer', 'Design', 'Milan'],
  ['Mateo Fernandez', 'Account executive', 'Sales', 'Madrid'],
  ['Amara Okafor', 'Data analyst', 'Insights', 'Lagos'],
  ['Lukas Novak', 'Frontend engineer', 'Web', 'Prague'],
  ['Priya Nair', 'QA engineer', 'Web', 'Bengaluru'],
  ['Elias Lindqvist', 'Support specialist', 'Support', 'Stockholm'],
  ['Zofia Kowalska', 'Frontend engineer', 'Web', 'Warsaw'],
  ['Daniel Becker', 'Sales engineer', 'Sales', 'Berlin'],
  ['Camille Laurent', 'Content designer', 'Design', 'Paris'],
  ['Omar Haddad', 'Site reliability engineer', 'Platform', 'Dubai'],
  ['Isabela Costa', 'Data engineer', 'Insights', 'Lisbon'],
  ['Thomas Wright', 'Support specialist', 'Support', 'Toronto'],
  ['Mei Lin Chen', 'Product designer', 'Design', 'Singapore'],
  ['Jonas Meyer', 'Account manager', 'Sales', 'Vienna'],
];
/* end:skip-in-preview */

const exampleContainer = document.querySelector('#example1');

const searchWrapper = document.createElement('div');

searchWrapper.className = 'example-controls-container';

const controlsDiv = document.createElement('div');

controlsDiv.className = 'controls';

const searchLabel = document.createElement('label');

searchLabel.setAttribute('for', 'search-filter-input');
searchLabel.textContent = 'Filter rows';

const searchInput = document.createElement('input');

searchInput.id = 'search-filter-input';
searchInput.type = 'search';

const hotContainer = document.createElement('div');

controlsDiv.appendChild(searchLabel);
controlsDiv.appendChild(searchInput);
searchWrapper.appendChild(controlsDiv);
exampleContainer.appendChild(searchWrapper);
exampleContainer.appendChild(hotContainer);

const hot = new Handsontable(hotContainer, {
  data,
  rowHeaders: true,
  colHeaders: ['Name', 'Role', 'Team', 'Location'],
  height: 'auto',
  search: true,
  hiddenRows: {
    copyPasteEnabled: false,
  },
  // licenseKey: 'your-license-key', get a key at https://handsontable.com/pricing/
});

const debounce = (callback, delay = 120) => {
  let timeoutId;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
};

searchInput.addEventListener(
  'input',
  debounce(() => {
    const results = hot.getPlugin('search').query(searchInput.value);
    const matchingRows = new Set(results.map((result) => result.row));

    const hiddenRows = hot.getPlugin('hiddenRows');
    const rowsToHide = [];

    if (searchInput.value !== '') {
      for (let row = 0; row < hot.countRows(); row += 1) {
        if (!matchingRows.has(row)) {
          rowsToHide.push(row);
        }
      }
    }

    hot.batch(() => {
      hiddenRows.showRows(hiddenRows.getHiddenRows().filter((row) => row !== null));
      hiddenRows.hideRows(rowsToHide);
      hot.render();
    });
  }),
);
