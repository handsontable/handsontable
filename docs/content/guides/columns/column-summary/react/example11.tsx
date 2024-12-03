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
      data={[[0, 1, 2], ['3c', '4b', 5], [], []]}
      colHeaders={true}
      rowHeaders={true}
      columnSummary={[
        {
          type: 'sum',
          destinationRow: 0,
          destinationColumn: 0,
          reversedRowCoords: true,
          // enable throwing data type errors for this column summary
          suppressDataTypeErrors: false,
        },
        {
          type: 'sum',
          destinationRow: 0,
          destinationColumn: 1,
          reversedRowCoords: true,
          // enable throwing data type errors for this column summary
          suppressDataTypeErrors: false,
        },
      ]}
      height="auto"
    />
  );
};

export default ExampleComponent;
