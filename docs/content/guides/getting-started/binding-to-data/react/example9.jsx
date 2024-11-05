import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => (
  <HotTable
    autoWrapRow={true}
    autoWrapCol={true}
    height="auto"
    licenseKey="non-commercial-and-evaluation"
  />
);

export default ExampleComponent;
