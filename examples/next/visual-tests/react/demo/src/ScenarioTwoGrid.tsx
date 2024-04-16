import { HyperFormula } from 'hyperformula';
import { HotTable } from '@handsontable/react';
import { scenarioDataTop, scenarioDataBottom } from './constants';

const ScenarioTwoGrid = () => {
  return (
    <div id="hot">
      <input type='text' placeholder='Input 1' style={{ margin: '10px' }}/>
      <HotTable
        title='Table 1'
        data={scenarioDataTop}
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
        height={350}
        rowHeaders={true}
        columns={[
          { data: 'product_id', type: 'numeric' },
          { data: 'mobile_apps', type: 'text' },
          { data: 'pricing', type: 'text' },
          { data: 'rating', type: 'numeric' },
          { data: 'dataType', type: 'text' },
          { data: 'industry', type: 'text' },
          { data: 'business_scale', type: 'text' },
          { data: 'user_type', type: 'text' },
          { data: 'no_of_users', type: 'text' },
          { data: 'deployment', type: 'text' },
          { data: 'OS', type: 'text' },
        ]}
        formulas={{
          engine: HyperFormula,
        }}
        fixedRowsBottom={2}
        autoWrapCol={true}
        autoWrapRow={true}
        nestedRows={true}
        bindRowsWithHeaders={true}
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
      <input type='text' placeholder='Input 2' style={{ margin: '10px' }}/>
      <HotTable
        title='Table 2'
        data={scenarioDataBottom}
        colHeaders={[
          'Category',
          'Product ID',
          'Industry',
          'Business Scale',
          'User Type',
          'No of Users',
          'Deployment',
          'OS',
          'Mobile Apps',
          'Pricing',
          'Rating',
        ]}
        height={200}
        rowHeaders={true}
        columns={[
          { data: 'category', type: 'text' },
          { data: 'product_id', type: 'numeric' },
          { data: 'industry', type: 'text' },
          { data: 'business_scale', type: 'text' },
          { data: 'user_type', type: 'text' },
          { data: 'no_of_users', type: 'text' },
          { data: 'deployment', type: 'text' },
          { data: 'OS', type: 'text' },
          { data: 'mobile_apps', type: 'text' },
          { data: 'pricing', type: 'text' },
          { data: 'rating', type: 'numeric' },
        ]}
        autoWrapCol={true}
        autoWrapRow={true}
        nestedRows={true}
        bindRowsWithHeaders={true}
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
    </div>
  );
};

export default ScenarioTwoGrid;
