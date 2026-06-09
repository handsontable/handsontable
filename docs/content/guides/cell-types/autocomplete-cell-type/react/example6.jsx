import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const fruits = [
  'Apple',
  'Apricot',
  'Avocado',
  'Banana',
  'Blueberry',
  'Cherry',
  'Grape',
  'Lemon',
  'Lime',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Pineapple',
  'Plum',
  'Raspberry',
  'Strawberry',
  'Watermelon',
];

const ExampleComponent = () => {
  return (
    <HotTable
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['Apple', 'Apple'],
        ['Banana', 'Banana'],
        ['Cherry', 'Cherry'],
        ['Mango', 'Mango'],
        ['Orange', 'Orange'],
      ]}
      colHeaders={['Filter: true (default)', 'Filter: false']}
      columns={[
        {
          type: 'autocomplete',
          source: fruits,
          strict: false,
          // filter: true is the default — only matching options are shown
        },
        {
          type: 'autocomplete',
          source: fruits,
          strict: false,
          // don't hide options that don't match the search query
          filter: false,
        },
      ]}
    />
  );
};

export default ExampleComponent;
