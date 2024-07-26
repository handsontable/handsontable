import React from 'react';
import { HotTable } from '@handsontable/react';
import { scenarioData } from './constants';

const ScenarioTwoGrid = () => {

  return (
    <HotTable
      title='Table 1'
      data={scenarioData}
      colHeaders={[
        'Product ID',
        'Mobile Apps',
        'Pricing',
        'Rating',
        'Category',
        'Industry',
        'Business Scale',
        'User Type',
        'No of Users',
        'Deployment',
        'OS',
      ]}
      height={250}
      rowHeaders={true}
      columns={[
        { data: 'product_id', type: 'numeric' },
        { data: 'mobile_apps', type: 'text' },
        { data: 'pricing', type: 'text' },
        { data: 'rating', type: 'numeric' },
        { data: 'category', type: 'text' },
        { data: 'industry', type: 'text' },
        { data: 'business_scale', type: 'text' },
        { data: 'user_type', type: 'text' },
        { data: 'no_of_users', type: 'text' },
        { data: 'deployment', type: 'text' },
        { data: 'OS', type: 'text' },
      ]}
      autoWrapCol={true}
      autoWrapRow={true}
      nestedRows={true}
      comments={true}
      dropdownMenu={true}
      filters={true}
      manualRowMove={true}
      manualColumnMove={true}
      manualRowResize={true}
      manualColumnResize={true}
      mergeCells={true}
      multiColumnSorting={true}
      contextMenu={true}
      licenseKey='non-commercial-and-evaluation'
    />
  );
};

export default ScenarioTwoGrid;
