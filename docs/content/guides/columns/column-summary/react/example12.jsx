import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[[0.5, 0.5], [0.5, 0.5], [1, 1], [], []]}
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
