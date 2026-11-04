import { FC } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent: FC = () => (
  <HotTable
    // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
    autoWrapRow={true}
    autoWrapCol={true}
    height="auto"
  />
);

export default ExampleComponent;
