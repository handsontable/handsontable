import React from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

const data = [
  { id: 1, name: { first: 'Ted', last: 'Right' }, address: '' },
  { id: 2, address: '' },
  { id: 3, name: { first: 'Joan', last: 'Well' }, address: '' },
];

const ExampleComponent = () => (
  <HotTable
    data={data}
    colHeaders={true}
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
