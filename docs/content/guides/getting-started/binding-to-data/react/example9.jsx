import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => (
  <HotTable
    // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
    autoWrapRow={true}
    autoWrapCol={true}
    height="auto"
  />
);

export default ExampleComponent;
