import { HotTable, HotColumn } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['SKU-4821', 'Stainless Steel Water Bottle', 'Harbor Goods', '142'],
        ['SKU-0093', 'Wireless Mouse', 'Alpine Supply Co.', '0'],
        ['SKU-1170', 'Ergonomic Office Chair', 'Cascade Distributors', '67'],
      ]}
      colHeaders={true}
      rowHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
      headerClassName="htLeft"
      licenseKey="non-commercial-and-evaluation"
    >
      <HotColumn headerClassName="italic-text" />
      <HotColumn headerClassName="bold-text italic-text" />
      <HotColumn headerClassName="htRight bold-text italic-text" />
      <HotColumn />
    </HotTable>
  );
};

export default ExampleComponent;
