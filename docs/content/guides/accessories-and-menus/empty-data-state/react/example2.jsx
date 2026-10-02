import React, { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const hotTableRef = useRef(null);

  return (
    <HotTable
      ref={hotTableRef}
      data={[]} // Empty data to trigger empty state
      height="auto"
      colHeaders={['Name', 'Job title', 'Department', 'City']}
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
              text: 'Load employees',
              type: 'primary',
              callback: () => {
                hotTableRef.current?.hotInstance.loadData([
                  ['Ana García', 'Senior Engineer', 'Engineering', 'Austin'],
                  ['James Okafor', 'Product Manager', 'Product', 'Chicago'],
                  ['Li Wei', 'Data Analyst', 'Analytics', 'Seattle'],
                  ['Priya Raman', 'Marketing Lead', 'Marketing', 'Denver'],
                  ['Marcus Johnson', 'HR Business Partner', 'People Operations', 'Atlanta'],
                ]);
              },
            },
          ],
        },
      }}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
