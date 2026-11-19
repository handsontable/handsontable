import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [[0, 1, 2], ['3c', '4b', 5], [], []];

const ExampleComponent = () => {
  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      autoWrapRow={true}
      autoWrapCol={true}
      data={data}
      colHeaders={true}
      rowHeaders={true}
      columnSummary={[
        {
          type: 'sum',
          destinationRow: 0,
          destinationColumn: 0,
          reversedRowCoords: true,
          // force this column summary to treat non-numeric values as numeric values
          forceNumeric: true,
        },
        {
          type: 'sum',
          destinationRow: 0,
          destinationColumn: 1,
          reversedRowCoords: true,
          // force this column summary to treat non-numeric values as numeric values
          forceNumeric: true,
        },
      ]}
      height="auto"
    />
  );
};

export default ExampleComponent;
