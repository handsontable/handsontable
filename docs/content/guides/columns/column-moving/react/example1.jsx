import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

// generate an array of arrays with dummy data
const data = new Array(200) // number of rows
  .fill(null)
  .map((_, row) =>
    new Array(20) // number of columns
      .fill(null)
      .map((_, column) => `${row}, ${column}`)
  );

const ExampleComponent = () => {
  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      data={data}
      width="100%"
      height={320}
      rowHeaders={true}
      colHeaders={true}
      colWidths={100}
      manualColumnMove={true}
      autoWrapRow={true}
      autoWrapCol={true}
    />
  );
};

export default ExampleComponent;
