import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [[0.5, 0.5], [0.5, 0.5], [1, 1], [], []];

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
          type: 'average',
          destinationRow: 0,
          destinationColumn: 0,
          reversedRowCoords: true,
        },
        {
          type: 'average',
          destinationRow: 0,
          destinationColumn: 1,
          reversedRowCoords: true,
          // round this column summary result to two digits after the decimal point
          roundFloat: 2,
        },
      ]}
      height="auto"
    />
  );
};

export default ExampleComponent;
