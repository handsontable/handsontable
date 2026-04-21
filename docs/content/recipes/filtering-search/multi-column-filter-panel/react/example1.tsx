import { useRef, useState } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './example1.css';

registerAllModules();

/* start:skip-in-preview */
const sourceData = [
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

const ExampleComponent = () => {
  const hotRef = useRef<HotTableRef>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  function applyFilters(name: string, category: string, min: string, max: string) {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    const filtersPlugin = hot.getPlugin('filters');

    filtersPlugin.clearConditions();

    if (category) {
      filtersPlugin.addCondition(1, 'eq', [category]);
    }

    if (name.trim()) {
      filtersPlugin.addCondition(0, 'contains', [name.trim()]);
    }

    if (min && max) {
      const lowerBound = Number(min);
      const upperBound = Number(max);

      if (Number.isFinite(lowerBound) && Number.isFinite(upperBound)) {
        filtersPlugin.addCondition(2, 'between', [lowerBound, upperBound]);
      }
    } else if (min) {
      const lowerBound = Number(min);

      if (Number.isFinite(lowerBound)) {
        filtersPlugin.addCondition(2, 'gte', [lowerBound]);
      }
    } else if (max) {
      const upperBound = Number(max);

      if (Number.isFinite(upperBound)) {
        filtersPlugin.addCondition(2, 'lte', [upperBound]);
      }
    }

    filtersPlugin.filter();
    hot.render();
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    setNameFilter(value);
    applyFilters(value, categoryFilter, minPrice, maxPrice);
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;

    setCategoryFilter(value);
    applyFilters(nameFilter, value, minPrice, maxPrice);
  }

  function handleMinPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    setMinPrice(value);
    applyFilters(nameFilter, categoryFilter, value, maxPrice);
  }

  function handleMaxPriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    setMaxPrice(value);
    applyFilters(nameFilter, categoryFilter, minPrice, value);
  }

  function clearFilters() {
    setNameFilter('');
    setCategoryFilter('');
    setMinPrice('');
    setMaxPrice('');

    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    const filtersPlugin = hot.getPlugin('filters');

    filtersPlugin.clearConditions();
    filtersPlugin.filter();
    hot.render();
  }

  return (
    <div>
      <div className="example-controls-container">
        <div className="filter-panel">
          <label className="filter-label filter-label--wide">
            Product name
            <input
              type="text"
              placeholder="Contains..."
              value={nameFilter}
              onChange={handleNameChange}
            />
          </label>
          <label className="filter-label filter-label--wide">
            Category
            <select value={categoryFilter} onChange={handleCategoryChange}>
              <option value="">All categories</option>
              <option value="Bikes">Bikes</option>
              <option value="Safety">Safety</option>
              <option value="Components">Components</option>
              <option value="Accessories">Accessories</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </label>
          <label className="filter-label">
            Min price
            <input
              type="number"
              min="0"
              placeholder="0"
              value={minPrice}
              onChange={handleMinPriceChange}
            />
          </label>
          <label className="filter-label">
            Max price
            <input
              type="number"
              min="0"
              placeholder="2500"
              value={maxPrice}
              onChange={handleMaxPriceChange}
            />
          </label>
          <button type="button" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      </div>
      <HotTable
        ref={hotRef}
        data={sourceData}
        columns={[
          { data: 'name', type: 'text', title: 'Product' },
          { data: 'category', type: 'text', title: 'Category' },
          { data: 'price', type: 'numeric', title: 'Price' },
          { data: 'stock', type: 'numeric', title: 'Stock' },
        ]}
        colHeaders={['Product', 'Category', 'Price', 'Stock']}
        rowHeaders={true}
        filters={true}
        dropdownMenu={false}
        width="100%"
        height={320}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
