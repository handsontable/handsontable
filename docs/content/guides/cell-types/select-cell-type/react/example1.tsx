import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        ['2017', 'Honda', 10],
        ['2018', 'Toyota', 20],
        ['2019', 'Nissan', 30],
      ]}
      colWidths={[70, 90, 80]}
      colHeaders={['Year', 'Make', 'In stock']}
      columns={[
        {},
        {
          type: 'select',
          selectOptions: ['Kia', 'Nissan', 'Toyota', 'Honda'],
        },
        {},
      ]}
      autoWrapRow={true}
      autoWrapCol={true}
      height="auto"
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
