import { useRef } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const data: string[][] = [
    ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', '142'],
    ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', '0'],
    ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', '67'],
    ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', '215'],
  ];

  const hotTableComponentRef = useRef<HotTableRef>(null);

  const selectCell = () => {
    // The Handsontable instance is stored under the `hotInstance` property of the wrapper component.
    hotTableComponentRef.current?.hotInstance?.selectCell(1, 1);
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <button onClick={selectCell}>Select cell B2</button>
        </div>
      </div>
      <HotTable
        ref={hotTableComponentRef}
        data={data}
        colHeaders={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
