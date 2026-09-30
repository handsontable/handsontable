import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers/textRenderer';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example3');

const dimmedTextRenderer = (instance, td, ...rest) => {
  textRenderer(instance, td, ...rest);

  td.style.opacity = '0.6';
};

new Handsontable(container, {
  data: [
    { name: 'Hydrogen', symbol: 'H', atomicNumber: 1, atomicMass: 1.008 },
    { name: 'Helium', symbol: 'He', atomicNumber: 2, atomicMass: 4.003 },
    { name: 'Lithium', symbol: 'Li', atomicNumber: 3, atomicMass: 6.94 },
    { name: 'Beryllium', symbol: 'Be', atomicNumber: 4, atomicMass: 9.012 },
    { name: 'Boron', symbol: 'B', atomicNumber: 5, atomicMass: 10.81 },
  ],
  height: 'auto',
  colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
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
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
