import React, { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [];

const ExampleComponent = () => {
  const hotTableRef = useRef(null);

  return (
    <HotTable
      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/
      ref={hotTableRef}
      data={data} // Empty data to trigger empty state
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      navigableHeaders={true}
      dropdownMenu={true}
      filters={true}
      emptyDataState={true} // Enable empty data state with default settings
    />
  );
};

export default ExampleComponent;
