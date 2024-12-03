import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        {
          car: 'Mercedes A 160',
          year: 2017,
          available: true,
          comesInBlack: 'yes',
        },
        {
          car: 'Citroen C4 Coupe',
          year: 2018,
          available: false,
          comesInBlack: 'yes',
        },
        {
          car: 'Audi A4 Avant',
          year: 2019,
          available: true,
          comesInBlack: 'no',
        },
        {
          car: 'Opel Astra',
          year: 2020,
          available: false,
          comesInBlack: 'yes',
        },
        {
          car: 'BMW 320i Coupe',
          year: 2021,
          available: false,
          comesInBlack: 'no',
        },
      ]}
      colHeaders={['Car model', 'Accepted', 'Comes in black']}
      height="auto"
      columns={[
        {
          data: 'car',
        },
        {
          data: 'available',
          type: 'checkbox',
          label: {
            position: 'after',
            property: 'car',
          },
        },
        {
          data: 'comesInBlack',
          type: 'checkbox',
          checkedTemplate: 'yes',
          uncheckedTemplate: 'no',
          label: {
            position: 'before',
            value: 'In black? ',
          },
        },
      ]}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
