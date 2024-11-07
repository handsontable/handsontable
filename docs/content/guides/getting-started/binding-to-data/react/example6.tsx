import { FC } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent: FC = () => (
  <HotTable
    data={[]}
    dataSchema={{
      id: null,
      name: {
        first: null,
        last: null,
      },
      address: null,
    }}
    startRows={5}
    startCols={4}
    colHeaders={['ID', 'First Name', 'Last Name', 'Address']}
    height="auto"
    width="auto"
    columns={[
      { data: 'id' },
      { data: 'name.first' },
      { data: 'name.last' },
      { data: 'address' },
    ]}
    minSpareRows={1}
    autoWrapRow={true}
    autoWrapCol={true}
    licenseKey="non-commercial-and-evaluation"
  />
);

export default ExampleComponent;
