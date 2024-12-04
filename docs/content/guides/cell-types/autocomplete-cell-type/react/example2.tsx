import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const colors = [
    'yellow',
    'red',
    'orange',
    'green',
    'blue',
    'gray',
    'black',
    'white',
    'purple',
    'lime',
    'olive',
    'cyan',
  ];

  const cars = ['BMW', 'Chrysler', 'Nissan', 'Suzuki', 'Toyota', 'Volvo'];

  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['BMW', 2017, 'black', 'black'],
        ['Nissan', 2018, 'blue', 'blue'],
        ['Chrysler', 2019, 'yellow', 'black'],
        ['Volvo', 2020, 'white', 'gray'],
      ]}
      colHeaders={[
        'Car<br>(allowInvalid true)',
        'Year',
        'Chassis color<br>(allowInvalid false)',
        'Bumper color<br>(allowInvalid true)',
      ]}
      columns={[
        {
          type: 'autocomplete',
          source: cars,
          strict: true,
          // allowInvalid: true // true is default
        },
        {},
        {
          type: 'autocomplete',
          source: colors,
          strict: true,
          allowInvalid: false,
        },
        {
          type: 'autocomplete',
          source: colors,
          strict: true,
          allowInvalid: true, // true is default
        },
      ]}
    />
  );
};

export default ExampleComponent;
