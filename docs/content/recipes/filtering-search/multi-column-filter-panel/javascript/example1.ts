import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

type Product = {
  name: string;
  category: string;
  price: number;
  stock: number;
};

/* start:skip-in-preview */
const sourceData: Product[] = [
  { name: 'Trail Bike', category: 'Bikes', price: 1499, stock: 12 },
  { name: 'Road Helmet', category: 'Safety', price: 89, stock: 42 },
  { name: 'Flat Pedals', category: 'Components', price: 59, stock: 80 },
  { name: 'Hydration Pack', category: 'Accessories', price: 129, stock: 23 },
  { name: 'Brake Pads', category: 'Components', price: 25, stock: 150 },
  { name: 'Cycling Glasses', category: 'Accessories', price: 79, stock: 33 },
  { name: 'Chain Lube', category: 'Maintenance', price: 16, stock: 99 },
  { name: 'Torque Wrench', category: 'Maintenance', price: 139, stock: 14 },
  { name: 'Kids Helmet', category: 'Safety', price: 54, stock: 20 },
  { name: 'Gravel Bike', category: 'Bikes', price: 2199, stock: 7 },
];
/* end:skip-in-preview */

const rootContainer = document.querySelector('#example1')!;

rootContainer.innerHTML = `
  <div class="example-controls-container">
    <div class="filter-panel">
      <label class="filter-label filter-label--wide">
        Product name
        <input id="nameFilter" type="text" placeholder="Contains..." />
      </label>
      <label class="filter-label filter-label--wide">
        Category
        <select id="categoryFilter">
          <option value="">All categories</option>
          <option value="Bikes">Bikes</option>
          <option value="Safety">Safety</option>
          <option value="Components">Components</option>
          <option value="Accessories">Accessories</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </label>
      <label class="filter-label">
        Min price
        <input id="minPriceFilter" type="number" min="0" placeholder="0" />
      </label>
      <label class="filter-label">
        Max price
        <input id="maxPriceFilter" type="number" min="0" placeholder="2500" />
      </label>
      <button id="clearFilters" type="button">Clear all filters</button>
    </div>
  </div>
  <div id="hot"></div>
`;

const container = rootContainer.querySelector('#hot')!;

const hot = new Handsontable(container, {
  data: sourceData,
  columns: [
    { data: 'name', type: 'text', title: 'Product' },
    { data: 'category', type: 'text', title: 'Category' },
    { data: 'price', type: 'numeric', title: 'Price' },
    { data: 'stock', type: 'numeric', title: 'Stock' },
  ],
  colHeaders: ['Product', 'Category', 'Price', 'Stock'],
  rowHeaders: true,
  filters: true,
  dropdownMenu: false,
  width: '100%',
  height: 320,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const filtersPlugin = hot.getPlugin('filters');

const categoryFilter = rootContainer.querySelector('#categoryFilter') as HTMLSelectElement;
const nameFilter = rootContainer.querySelector('#nameFilter') as HTMLInputElement;
const minPriceFilter = rootContainer.querySelector('#minPriceFilter') as HTMLInputElement;
const maxPriceFilter = rootContainer.querySelector('#maxPriceFilter') as HTMLInputElement;
const clearFiltersButton = rootContainer.querySelector('#clearFilters') as HTMLButtonElement;

function applyFilters(): void {
  const selectedCategory = categoryFilter.value;
  const enteredName = nameFilter.value.trim();
  const minPrice = minPriceFilter.value.trim();
  const maxPrice = maxPriceFilter.value.trim();

  filtersPlugin.clearConditions();

  if (selectedCategory) {
    filtersPlugin.addCondition(1, 'eq', [selectedCategory]);
  }

  if (enteredName) {
    filtersPlugin.addCondition(0, 'contains', [enteredName]);
  }

  if (minPrice && maxPrice) {
    const lowerBound = Number(minPrice);
    const upperBound = Number(maxPrice);

    if (Number.isFinite(lowerBound) && Number.isFinite(upperBound)) {
      filtersPlugin.addCondition(2, 'between', [lowerBound, upperBound]);
    }
  } else if (minPrice) {
    const lowerBound = Number(minPrice);

    if (Number.isFinite(lowerBound)) {
      filtersPlugin.addCondition(2, 'gte', [lowerBound]);
    }
  } else if (maxPrice) {
    const upperBound = Number(maxPrice);

    if (Number.isFinite(upperBound)) {
      filtersPlugin.addCondition(2, 'lte', [upperBound]);
    }
  }

  filtersPlugin.filter();
  hot.render();
}

function clearFilters(): void {
  categoryFilter.value = '';
  nameFilter.value = '';
  minPriceFilter.value = '';
  maxPriceFilter.value = '';

  filtersPlugin.clearConditions();
  filtersPlugin.filter();
  hot.render();
}

categoryFilter.addEventListener('change', applyFilters);
nameFilter.addEventListener('input', applyFilters);
minPriceFilter.addEventListener('input', applyFilters);
maxPriceFilter.addEventListener('input', applyFilters);
clearFiltersButton.addEventListener('click', clearFilters);
