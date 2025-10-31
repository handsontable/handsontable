import React, { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotTableRef = useRef(null);

  return (
    <HotTable
      ref={hotTableRef}
      themeName="ht-theme-main"
      data={[]} // Empty data to trigger empty state
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      navigableHeaders={true}
      dropdownMenu={true}
      filters={true}
      emptyDataState={true} // Enable empty data state with default settings
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
