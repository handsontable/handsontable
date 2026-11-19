import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const statuses = ['Backlog', 'In progress', 'Blocked', 'Done', 'Cancelled'];

const data = [
  ['Backlog', 'Backlog'],
  ['In progress', 'In progress'],
  ['Blocked', 'Blocked'],
  ['Done', 'Done'],
  ['Cancelled', 'Cancelled'],
];

const ExampleComponent = () => {
  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      data={data}
      colHeaders={['Source order (default)', 'Alphabetical order']}
      columns={[
        {
          type: 'autocomplete',
          source: statuses,
          strict: false,
          // sortByRelevance: true is the default — suggestions keep the order from `source`
        },
        {
          type: 'autocomplete',
          source: statuses,
          strict: false,
          // sort suggestions alphabetically instead of using the `source` order
          sortByRelevance: false,
        },
      ]}
    />
  );
};

export default ExampleComponent;
