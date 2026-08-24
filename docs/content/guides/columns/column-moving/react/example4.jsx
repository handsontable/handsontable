import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

const data = [
    ['SKU-4821', 'Wireless keyboard', 'Harbor Goods', 142],
    ['SKU-0093', 'USB-C dock', 'Vertex Supply', 67],
    ['SKU-3148', '27-inch monitor', 'Alpine Supply Co.', 24],
    ['SKU-7720', 'Laptop stand', 'Northstar Wholesale', 89],
    ['SKU-1056', 'Noise-canceling headset', 'Summit Distribution', 35],
];

const ExampleComponent = () => {
    const allowColumnMoving = useRef(false);

    const handleChange = (event) => {
        allowColumnMoving.current = event.target.checked;
    };

    return (<div>
      <div className="example-controls-container">
        <div className="controls">
          <label>
            <input type="checkbox" onChange={handleChange}/>
            Allow column moving
          </label>
        </div>
      </div>
      <HotTable data={data} colHeaders={['SKU', 'Product', 'Supplier', 'Stock']} rowHeaders={true} manualColumnMove={true} beforeColumnMove={() => allowColumnMoving.current} stretchH="all" height="auto" licenseKey="non-commercial-and-evaluation"/>
    </div>);
};

export default ExampleComponent;
