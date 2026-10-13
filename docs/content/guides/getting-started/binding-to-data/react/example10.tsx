import { useEffect, useRef, FC } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// Register Handsontable's modules
registerAllModules();

const data: string[][] = [
  ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', 'Drinkware', 'Seattle'],
  ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', 'Electronics', 'Denver'],
  ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', 'Furniture', 'Portland'],
  ['SKU-2208', 'USB-C Charging Cable', 'Summit Trading', 'Electronics', 'Austin'],
  ['SKU-3341', 'Aluminum Water Filter', 'Northgate Wholesale', 'Drinkware', 'Minneapolis'],
];

const ExampleComponent: FC = () => {
  const hotRef = useRef<HotTableRef>(null);

  useEffect(() => {
    const hot = hotRef.current?.hotInstance;

    if (hot) {
      hot.setDataAtCell(0, 4, 'Denver');
    }
  }, []); // run once

  return (
    <HotTable
      ref={hotRef}
      data={data}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
