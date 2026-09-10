import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
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

const container = document.querySelector('#exampleExcludeRowsFromSorting')!;

const hot = new Handsontable(container, {
  data: products,
  columns: [
    { data: 'name', type: 'text' },
    {
      data: 'price',
      type: 'numeric',
      locale: 'en-US',
      numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
    },
    { data: 'inStock', type: 'numeric' },
  ],
  colHeaders: ['Product', 'Price', 'In stock'],
  height: 'auto',
  stretchH: 'all',
  columnSorting: true,
  // `afterColumnSort()` is a Handsontable hook: it fires after every sort. Move the featured
  // rows back to the top of the view. The rule reads the data, not a row position, so you pin
  // a row by flagging it rather than by knowing where it sits.
  afterColumnSort() {
    const featuredRows = products
      .map((product, physicalRow) => (product.featured ? hot.toVisualRow(physicalRow) : null))
      .filter((visualRow): visualRow is number => visualRow !== null);

    // Pass every index in one call: each move shifts the rows after it.
    hot.rowIndexMapper.moveIndexes(featuredRows, 0);
  },
  // `cells()` receives a physical row index, so it reads the source array directly.
  cells(row) {
    return products[row]?.featured ? { className: 'featured-product' } : {};
  },
  licenseKey: 'non-commercial-and-evaluation',
});
