// you need `useRef` to call Handsontable's instance methods
import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

type Product = {
  name: string;
  price: number;
  inStock: number;
  featured?: boolean;
};

// The two featured products always stay at the top, whichever column you sort by.
// No row here is frozen: rows frozen with `fixedRowsTop` or `fixedRowsBottom` are already
// left out of sorting, and need no code at all.
const products: Product[] = [
  { name: 'HL Mountain Frame', price: 1890.9, inStock: 11, featured: true },
  { name: 'HL Road Tire', price: 279.99, inStock: 3, featured: true },
  { name: 'Cycling Cap', price: 130.1, inStock: 0 },
  { name: 'Road Tire Tube', price: 59, inStock: 1 },
  { name: 'Racing Socks', price: 30, inStock: 5 },
  { name: 'Water Bottle', price: 12.5, inStock: 24 },
  { name: 'Bike Light', price: 45, inStock: 8 },
  { name: 'Chain Lube', price: 9.99, inStock: 17 },
];

const ExampleComponent = () => {
  const hotTableComponentRef = useRef<HotTableRef>(null);
  // Move the featured rows back to the top of the view. The rule reads the data, not a row
  // position, so you pin a row by flagging it rather than by knowing where it sits.
  const pinFeaturedRows = () => {
    const handsontableInstance = hotTableComponentRef.current?.hotInstance;

    if (!handsontableInstance) {
      return;
    }

    const featuredRows = products
      .map((product, physicalRow) =>
        (product.featured ? handsontableInstance.toVisualRow(physicalRow) : null))
      .filter((visualRow): visualRow is number => visualRow !== null);

    // Pass every index in one call: each move shifts the rows after it.
    handsontableInstance.rowIndexMapper.moveIndexes(featuredRows, 0);
  };

  return (
    <HotTable
      ref={hotTableComponentRef}
      data={products}
      columns={[
        { data: 'name', type: 'text' },
        {
          data: 'price',
          type: 'numeric',
          locale: 'en-US',
          numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
        },
        { data: 'inStock', type: 'numeric' },
      ]}
      colHeaders={['Product', 'Price', 'In stock']}
      height="auto"
      stretchH="all"
      columnSorting={true}
      // `afterColumnSort()` is a Handsontable hook: it's fired after each sorting
      afterColumnSort={pinFeaturedRows}
      // `cells()` receives a physical row index, so it reads the source array directly.
      cells={(row: number) => (products[row]?.featured ? { className: 'featured-product' } : {})}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
