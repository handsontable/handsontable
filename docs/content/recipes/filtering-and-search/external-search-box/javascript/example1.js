import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable modules.
registerAllModules();

/* start:skip-in-preview */
const data = [
  ['Alice Johnson', 'Engineering', 'Berlin', 'alice.johnson@example.com'],
  ['Noah Smith', 'Design', 'Warsaw', 'noah.smith@example.com'],
  ['Mia Garcia', 'Marketing', 'New York', 'mia.garcia@example.com'],
  ['Liam Brown', 'Engineering', 'Toronto', 'liam.brown@example.com'],
  ['Emma Davis', 'Sales', 'London', 'emma.davis@example.com'],
  ['Oliver Miller', 'Support', 'Madrid', 'oliver.miller@example.com'],
];
/* end:skip-in-preview */

const exampleContainer = document.querySelector('#example1');

const searchWrapper = document.createElement('div');
searchWrapper.className = 'example-controls-container';

const controlsDiv = document.createElement('div');
controlsDiv.className = 'controls';

const searchLabel = document.createElement('label');
searchLabel.setAttribute('for', 'external-search-input');
searchLabel.textContent = 'Search rows';

const searchInput = document.createElement('input');
searchInput.id = 'external-search-input';
searchInput.type = 'search';
searchInput.placeholder = 'Type to highlight matching cells...';

const hotContainer = document.createElement('div');

controlsDiv.appendChild(searchLabel);
controlsDiv.appendChild(searchInput);
searchWrapper.appendChild(controlsDiv);
exampleContainer.appendChild(searchWrapper);
exampleContainer.appendChild(hotContainer);

const hot = new Handsontable(hotContainer, {
  data,
  rowHeaders: true,
  colHeaders: ['Name', 'Team', 'Location', 'Email'],
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  autoWrapCol: true,
  search: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const debounce = (callback, delay = 120) => {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
};

const runSearch = debounce((value) => {
  const searchPlugin = hot.getPlugin('search');

  searchPlugin.query(value);
  hot.render();
});

searchInput.addEventListener('input', (event) => {
  runSearch(event.target.value);
});
