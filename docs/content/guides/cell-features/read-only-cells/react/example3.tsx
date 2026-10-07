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

const data = [
  { name: 'Hydrogen', symbol: 'H', atomicNumber: 1, atomicMass: 1.008 },
  { name: 'Helium', symbol: 'He', atomicNumber: 2, atomicMass: 4.003 },
  { name: 'Lithium', symbol: 'Li', atomicNumber: 3, atomicMass: 6.94 },
  { name: 'Beryllium', symbol: 'Be', atomicNumber: 4, atomicMass: 9.012 },
  { name: 'Boron', symbol: 'B', atomicNumber: 5, atomicMass: 10.81 },
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      height="auto"
      colHeaders={['Name', 'Symbol', 'Atomic number', 'Atomic mass']}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      columns={[
        {
          data: 'name',
          editor: false,
          renderer: dimmedTextRenderer,
        },
        {
          data: 'symbol',
          editor: 'text',
        },
        {
          data: 'atomicNumber',
          editor: 'numeric',
        },
        {
          data: 'atomicMass',
          editor: 'numeric',
        },
      ]}
    />
  );
};

export default ExampleComponent;
