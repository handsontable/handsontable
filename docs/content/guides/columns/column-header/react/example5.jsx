import { HotTable, HotColumn } from '@handsontable/react-wrapper';
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
      ]}
      colHeaders={true}
      rowHeaders={true}
      autoWrapRow={true}
      autoWrapCol={true}
      height='auto'
      headerClassName='htLeft'
      licenseKey='non-commercial-and-evaluation'
    >
      <HotColumn
        headerClassName='italic-text'
      />
      <HotColumn
        headerClassName='bold-text italic-text'
      />
      <HotColumn
        headerClassName='htRight bold-text italic-text'
      />
      <HotColumn/>
    </HotTable>
  );
};

export default ExampleComponent;
