import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
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

const FilterLabel = ({ label, children }) => (
  <label className="filter-label">
    {label}
    {children}
  </label>
);

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const nameRef = useRef(null);
  const categoryRef = useRef(null);
  const minPriceRef = useRef(null);
  const maxPriceRef = useRef(null);

  const applyFilters = () => {
    const hot = hotRef.current?.hotInstance;

    if (!hot) {
      return;
    }

    const name = nameRef.current?.value ?? '';
    const category = categoryRef.current?.value ?? '';
    const minPrice = minPriceRef.current?.value ?? '';
    const maxPrice = maxPriceRef.current?.value ?? '';
    const filtersPlugin = hot.getPlugin('filters');

    filtersPlugin.clearConditions();

    if (category) {
      filtersPlugin.addCondition(1, 'eq', [category]);
    }

    if (name.trim()) {
      filtersPlugin.addCondition(0, 'contains', [name.trim()]);
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
  };

  const clearFilters = () => {
    if (nameRef.current) nameRef.current.value = '';
    if (categoryRef.current) categoryRef.current.value = '';
    if (minPriceRef.current) minPriceRef.current.value = '';
    if (maxPriceRef.current) maxPriceRef.current.value = '';

    applyFilters();
  };

  return (
    <div>
      <div className="example-controls-container">
        <div className="filter-panel">
          <FilterLabel label="Product name">
            <input
              ref={nameRef}
              type="text"
              placeholder="Contains..."
              onChange={applyFilters}
            />
          </FilterLabel>
          <FilterLabel label="Category">
            <select ref={categoryRef} onChange={applyFilters}>
              <option value="">All categories</option>
              <option value="Bikes">Bikes</option>
              <option value="Safety">Safety</option>
              <option value="Components">Components</option>
              <option value="Accessories">Accessories</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </FilterLabel>
          <FilterLabel label="Min price">
            <input
              ref={minPriceRef}
              type="number"
              min="0"
              placeholder="0"
              onChange={applyFilters}
            />
          </FilterLabel>
          <FilterLabel label="Max price">
            <input
              ref={maxPriceRef}
              type="number"
              min="0"
              placeholder="2500"
              onChange={applyFilters}
            />
          </FilterLabel>
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
