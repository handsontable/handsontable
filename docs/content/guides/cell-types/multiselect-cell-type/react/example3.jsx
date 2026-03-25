import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const requiredItems = ['Passport', 'Tickets', 'Wallet', 'Phone', 'Keys'];
const optionalExtras = ['Snacks', 'Book', 'Camera', 'Umbrella', 'First aid kit'];
const interests = ['Art', 'History', 'Nature', 'Food', 'Shopping'];

const sortAlphabetically = (entries) =>
  [...entries].sort((a, b) => String(a).localeCompare(String(b)));

const data = [
  [['Passport', 'Phone'], ['Snacks', 'Book'], ['Nature']],
  [['Tickets', 'Wallet'], ['Camera'], []],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
  [['Phone', 'Keys'], ['First aid kit', 'Snacks', 'Umbrella'], ['Nature']],
  [['Wallet', 'Phone'], [], ['Food', 'Shopping']],
  [['Passport', 'Tickets'], ['Book'], ['Art', 'History']],
];

const ExampleComponent = () => {
  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={data}
      columns={[
        {
          type: 'multiselect',
          source: requiredItems,
          title: 'Required items',
          allowEmpty: false,
        },
        {
          type: 'multiselect',
          source: optionalExtras,
          title: 'Optional extras',
          placeholder: 'Select up to 3',
          maxSelections: 3,
          visibleRows: 4,
          searchInput: false,
        },
        {
          type: 'multiselect',
          source: interests,
          title: 'Interests',
          placeholder: 'Select interests',
          sourceSortFunction: sortAlphabetically,
          filteringCaseSensitive: true,
        },
      ]}
      height="auto"
      stretchH="last"
      width="100%"
    />
  );
};

export default ExampleComponent;
