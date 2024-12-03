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
        ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'],
        ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'],
        ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3'],
      ]}
      colHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      height="auto"
      dropdownMenu={[
        'remove_col',
        '---------',
        'make_read_only',
        '---------',
        'alignment',
      ]}
    />
  );
};

export default ExampleComponent;
