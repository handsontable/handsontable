import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const statuses: string[] = [
  'Backlog',
  'In progress',
  'Blocked',
  'Done',
  'Cancelled',
];

const ExampleComponent = () => {
  return (
    <HotTable
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['Backlog', 'Backlog'],
        ['In progress', 'In progress'],
        ['Blocked', 'Blocked'],
        ['Done', 'Done'],
        ['Cancelled', 'Cancelled'],
      ]}
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
