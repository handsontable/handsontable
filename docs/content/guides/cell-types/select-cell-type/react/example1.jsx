import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';

// register Handsontable's modules
registerAllModules();

export const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['2017', 'Honda', 10],
        ['2018', 'Toyota', 20],
        ['2019', 'Nissan', 30]
      ]}
      colWidths={[50, 70, 50]}
      colHeaders={true}
      columns={[
        {},
        {
          type: 'select',
          selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda']
        },
        {}
      ]}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

/* start:skip-in-preview */
ReactDOM.render(<ExampleComponent />, document.getElementById('example1'));
/* end:skip-in-preview */