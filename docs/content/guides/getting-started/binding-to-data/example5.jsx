import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  const data = [
    { id: 1, name: { first: 'Ted', last: 'Right' }, address: '' },
    { id: 2, address: '' }, // Handsontable will create missing properties on demand
    { id: 3, name: { first: 'Joan', last: 'Well' }, address: '' }
  ];

  return (
    <HotTable
      data={data}
      colHeaders={true}
      height="auto"
      width="auto"
      columns={[
        { data: 'id' },
        { data: 'name.first' },
        { data: 'name.last' },
        { data: 'address' }
      ]}
      minSpareRows={1}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example5'));
/* end:skip-in-preview */