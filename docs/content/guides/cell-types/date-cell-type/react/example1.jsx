import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['Mercedes', 'A 160', '01/14/2021', 6999.95],
        ['Citroen', 'C4 Coupe', '12/01/2022', 8330],
        ['Audi', 'A4 Avant', '11/19/2023', 33900],
        ['Opel', 'Astra', '02/02/2021', 7000],
        ['BMW', '320i Coupe', '07/24/2022', 30500],
      ]}
      colHeaders={['Car', 'Model', 'Registration date', 'Price']}
      height="auto"
      columns={[
        {
          type: 'text',
        },
        {
          // 2nd cell is simple text, no special options here
        },
        {
          type: 'date',
          dateFormat: 'MM/DD/YYYY',
          correctFormat: true,
          defaultDate: '01/01/2020',
          // datePicker additional options
          // (see https://github.com/dbushell/Pikaday#configuration)
          datePickerConfig: {
            // First day of the week (0: Sunday, 1: Monday, etc)
            firstDay: 0,
            showWeekNumber: true,
            disableDayFn(date) {
              // Disable Sunday and Saturday
              return date.getDay() === 0 || date.getDay() === 6;
            },
          },
        },
        {
          type: 'numeric',
          numericFormat: {
            pattern: '$ 0,0.00',
          },
        },
      ]}
    />
  );
};

export default ExampleComponent;
