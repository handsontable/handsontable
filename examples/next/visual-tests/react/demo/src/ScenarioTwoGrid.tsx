import { HotTable } from "@handsontable/react";
import { scenarioDataTop, scenarioDataBottom } from "./constants";
import { getThemeName } from "./utils";

const ScenarioTwoGrid = () => {
  return (
    <div>
      <div id='tableTop'>
        <input type='text' placeholder='Input 1' style={{ margin: '10px' }} />
        <HotTable
          title='Table Top'
          data={scenarioDataTop}
          themeName={getThemeName()}
          colHeaders={true}
          nestedHeaders={[
            [
              { label: 'Product', colspan: 4 },
              { label: 'Category', colspan: 3 },
              { label: 'User', colspan: 2 },
              { label: 'System', colspan: 2 },
            ],
            [
              'Product ID',
              'Mobile Apps',
              'Pricing',
              'Rating',
              'Data Type',
              'Industry',
              'Business Scale',
              'User Type',
              'No of Users',
              'Deployment',
              'OS',
            ],
          ]}
          collapsibleColumns={true}
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
      </div>
      <div id='tableBottom'>
        <input type='text' placeholder='Input 2' style={{ margin: '10px' }} />
        <HotTable
          title='Table Bottom'
          data={scenarioDataBottom}
          themeName={getThemeName()}
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
          columnSummary = {[
            {
              sourceColumn: 10,
              type: 'average',
              destinationRow: 0,
              destinationColumn: 10,
              // force this column summary to treat non-numeric values as numeric values
              forceNumeric: true
            },
          ]}
          height={250}
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
          collapsibleColumns={true}
          licenseKey='non-commercial-and-evaluation'
        />
      </div>
    </div>
  );
};

export default ScenarioTwoGrid;
