import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example9')!;

new Handsontable(container, {
  themeName: 'ht-theme-main',
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
