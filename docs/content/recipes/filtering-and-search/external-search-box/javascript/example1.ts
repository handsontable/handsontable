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

if (!exampleContainer) {
  throw new Error('Example container not found.');
}

const searchWrapper = document.createElement('div');
searchWrapper.style.marginBottom = '12px';

const searchLabel = document.createElement('label');
searchLabel.setAttribute('for', 'external-search-input');
searchLabel.textContent = 'Search rows';
searchLabel.style.display = 'block';
searchLabel.style.marginBottom = '4px';

const searchInput = document.createElement('input');
searchInput.id = 'external-search-input';
searchInput.type = 'text';
searchInput.placeholder = 'Type to highlight matching cells...';
searchInput.style.width = '100%';
searchInput.style.boxSizing = 'border-box';
searchInput.style.padding = '8px';

const hotContainer = document.createElement('div');

searchWrapper.appendChild(searchLabel);
searchWrapper.appendChild(searchInput);
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

const debounce = <T extends (...args: unknown[]) => void>(callback: T, delay = 120) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
};

const runSearch = debounce((value: string) => {
  const searchPlugin = hot.getPlugin('search');

  searchPlugin.query(value);
  hot.render();
});

searchInput.addEventListener('input', (event) => {
  runSearch((event.target as HTMLInputElement).value);
});
