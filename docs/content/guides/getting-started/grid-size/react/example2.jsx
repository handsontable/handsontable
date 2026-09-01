import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const UNIT_SIZES = {
  px: { width: '600px', height: '300px' },
  '%': { width: '75%', height: '75%' },
  em: { width: '37.5em', height: '18.75em' },
  rem: { width: '37.5rem', height: '18.75rem' },
  vh: { width: '50vh', height: '50vh' },
  vw: { width: '50vw', height: '50vw' },
};

const UNIT_CAPTIONS = {
  px: 'A fixed pixel size, independent of any parent element or font size.',
  '%': "A percentage of the parent container's size (the dashed box).",
  em: "A multiple of this element's own font size.",
  rem: "A multiple of the document's root font size.",
  vh: "A percentage of the browser viewport's height.",
  vw: "A percentage of the browser viewport's width.",
};

const data = [
  ['SKU-4821', 'Wireless Mouse', 'Electronics', 'Harbor Goods', 142],
  ['SKU-0093', 'Canvas Tote Bag', 'Apparel', 'Alpine Supply Co.', 67],
  ['SKU-2210', 'USB-C Hub', 'Electronics', 'Harbor Goods', 0],
  ['SKU-7734', 'Ceramic Mug Set', 'Home Goods', 'Nordic Traders', 58],
  ['SKU-1145', 'Wool Scarf', 'Apparel', 'Alpine Supply Co.', 213],
  ['SKU-3399', 'Bluetooth Speaker', 'Electronics', 'Harbor Goods', 84],
  ['SKU-5567', 'Cotton T-Shirt', 'Apparel', 'Alpine Supply Co.', 310],
  ['SKU-8842', 'Desk Lamp', 'Home Goods', 'Nordic Traders', 45],
  ['SKU-6621', 'Laptop Stand', 'Electronics', 'Harbor Goods', 29],
  ['SKU-4470', 'Throw Blanket', 'Home Goods', 'Nordic Traders', 76],
  ['SKU-9983', 'Leather Wallet', 'Apparel', 'Alpine Supply Co.', 132],
  ['SKU-2287', 'Wireless Charger', 'Electronics', 'Harbor Goods', 97],
];

const ExampleComponent = () => {
  const [unit, setUnit] = useState('px');
  const { width, height } = UNIT_SIZES[unit];

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <label htmlFor="unitSelect">Grid size unit</label>
          <select id="unitSelect" value={unit} onChange={(event) => setUnit(event.target.value)}>
            {Object.keys(UNIT_SIZES).map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>
        <p className="unit-caption">{UNIT_CAPTIONS[unit]}</p>
      </div>
      <div id="exampleParent2">
        <HotTable
          data={data}
          colHeaders={['SKU', 'Product', 'Category', 'Supplier', 'Quantity']}
          rowHeaders={true}
          width={width}
          height={height}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>
    </>
  );
};

export default ExampleComponent;
