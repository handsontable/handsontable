import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Wireless mouse', 'Accessories', 24.9, 120],
  ['Mechanical keyboard', 'Accessories', 89, 45],
  ['27-inch monitor', 'Displays', 319.5, 18],
  ['USB-C dock', 'Accessories', 149, 32],
];

const ExampleComponent = () => {
  const [output, setOutput] = useState('Rename a header to see the change here.');

  return (
    <>
      <HotTable
        // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
        data={data}
        colHeaders={['Product', 'Category', 'Price', 'In stock']}
        rowHeaders={true}
        navigableHeaders={true}
        contextMenu={true}
        editableHeaders={{ columnHeaders: true, rowHeaders: true }}
        // Save the new names in your app here.
        afterHeaderChange={(axis, visualIndex, newValue, oldValue) => {
          setOutput(`Renamed the ${axis} header at index ${visualIndex} from "${oldValue}" to "${newValue}".`);
        }}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
      />
      <output className="console" id="output">
        {output}
      </output>
    </>
  );
};

export default ExampleComponent;
