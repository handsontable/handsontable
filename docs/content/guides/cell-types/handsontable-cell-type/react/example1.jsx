import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const colorData = [
    ['yellow'],
    ['red'],
    ['orange'],
    ['green'],
    ['blue'],
    ['gray'],
    ['black'],
    ['white'],
  ];

  const manufacturerData = [
    { name: 'BMW', country: 'Germany', owner: 'Bayerische Motoren Werke AG' },
    { name: 'Chrysler', country: 'USA', owner: 'Chrysler Group LLC' },
    { name: 'Nissan', country: 'Japan', owner: 'Nissan Motor Company Ltd' },
    { name: 'Suzuki', country: 'Japan', owner: 'Suzuki Motor Corporation' },
    { name: 'Toyota', country: 'Japan', owner: 'Toyota Motor Corporation' },
    { name: 'Volvo', country: 'Sweden', owner: 'Zhejiang Geely Holding Group' },
  ];

  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[
        ['Tesla', 2017, 'black', 'black'],
        ['Nissan', 2018, 'blue', 'blue'],
        ['Chrysler', 2019, 'yellow', 'black'],
        ['Volvo', 2020, 'white', 'gray'],
      ]}
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      columns={[
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: ['Marque', 'Country', 'Parent company'],
            autoColumnSize: true,
            data: manufacturerData,
            getValue() {
              const selection = this.getSelectedLast();

              // Get the manufacturer name of the clicked row and ignore header
              // coordinates (negative values)
              return this.getSourceDataAtRow(Math.max(selection[0], 0)).name;
            },
          },
        },
        { type: 'numeric' },
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: false,
            data: colorData,
          },
        },
        {
          type: 'handsontable',
          handsontable: {
            colHeaders: false,
            data: colorData,
          },
        },
      ]}
    />
  );
};

export default ExampleComponent;
