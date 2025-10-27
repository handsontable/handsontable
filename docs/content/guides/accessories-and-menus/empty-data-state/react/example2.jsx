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
      colHeaders={['First Name', 'Last Name', 'Email']}
      rowHeaders={true}
      navigableHeaders={true}
      dropdownMenu={true}
      filters={true}
      emptyDataState={{
        message: {
          title: 'No data available',
          description: 'Please add some data to get started.',
          buttons: [
            {
              text: 'Add Sample Data',
              type: 'primary',
              callback: () => {
                // Add some sample data
                hotTableRef.current?.hotInstance.loadData([
                  ['John', 'Doe', 'john@example.com'],
                  ['Jane', 'Smith', 'jane@example.com'],
                  ['Bob', 'Johnson', 'bob@example.com'],
                  ['Alice', 'Johnson', 'alice@example.com'],
                ]);
              }
            }
          ]
        }
      }}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
