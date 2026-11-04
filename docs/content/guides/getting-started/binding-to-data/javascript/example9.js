import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example9');

new Handsontable(container, {
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
});
