import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const colors = [
  'Black',
  'Blue',
  'brown',
  'cyan',
  'Gray',
  'green',
  'Lime',
  'Magenta',
  'Navy',
  'olive',
  'orange',
  'Pink',
  'Purple',
  'Red',
  'silver',
  'Teal',
  'White',
  'Yellow',
];

const ExampleComponent = () => {
  return (
    <HotTable
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['Black', 'Black'],
        ['Blue', 'Blue'],
        ['Gray', 'Gray'],
        ['Red', 'Red'],
        ['White', 'White'],
      ]}
      colHeaders={['Case-insensitive (default)', 'Case-sensitive']}
      columns={[
        {
          type: 'autocomplete',
          source: colors,
          strict: false,
          // filteringCaseSensitive: false is the default — typing "bl" matches "Black" and "blue"
        },
        {
          type: 'autocomplete',
          source: colors,
          strict: false,
          // match case while searching autocomplete options
          filteringCaseSensitive: true,
        },
      ]}
    />
  );
};

export default ExampleComponent;
