import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { BaseRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';

// register Handsontable's modules
registerAllModules();

const dimmedTextRenderer: BaseRenderer = (instance, td, ...rest) => {
  textRenderer(instance, td, ...rest);

  td.style.opacity = '0.6';
};

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
        { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
        { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
        { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' },
      ]}
      height="auto"
      colHeaders={['Car', 'Year', 'Chassis color', 'Bumper color']}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      columns={[
        {
          data: 'car',
          readOnly: true,
          renderer: dimmedTextRenderer,
        },
        {
          data: 'year',
        },
        {
          data: 'chassis',
        },
        {
          data: 'bumper',
        },
      ]}
    />
  );
};

export default ExampleComponent;
