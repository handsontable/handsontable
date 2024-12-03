import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['A1', 'B1', 'C1', 'D1'],
        ['A2', 'B2', 'C2', 'D2'],
        ['A3', 'B3', 'C3', 'D3'],
        ['A4', 'B4', 'C4', 'D4'],
        ['A5', 'B5', 'C5', 'D5'],
        ['A6', 'B6', 'C6', 'D6'],
        ['A7', 'B7', 'C7', 'D7'],
        ['A8', 'B8', 'C8', 'D8'],
        ['A9', 'B9', 'C9', 'D9'],
      ]}
      colHeaders={true}
      rowHeaders={true}
      trimRows={[1, 2, 5]}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
