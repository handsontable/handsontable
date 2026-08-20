import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[
        {
          value: null,
          __children: [{ value: 5 }, { value: 6 }, { value: 7 }],
        },
        {
          __children: [{ value: 15 }, { value: 16 }, { value: 17 }],
        },
      ]}
      columns={[{ data: 'value' }]}
      nestedRows={true}
      rowHeaders={true}
      colHeaders={['sum', 'min', 'max', 'count', 'average']}
      columnSummary={function () {
        const endpoints = [];
        const nestedRowsPlugin = this.hot.getPlugin('nestedRows');
        const resultColumn = 0;

        if (!nestedRowsPlugin.isEnabled()) {
          return [];
        }

        for (let visualRow = 0; visualRow < this.hot.countRows(); visualRow++) {
          // Only summarize the top-level parents.
          if (nestedRowsPlugin.getRowLevel(visualRow) !== 0 || !nestedRowsPlugin.isParent(visualRow)) {
            continue;
          }

          const parentRow = this.hot.toPhysicalRow(visualRow);
          const childCount = nestedRowsPlugin.countChildren(visualRow);

          // Children follow their parent in the source data, so they form one range.
          endpoints.push({
            destinationColumn: resultColumn,
            destinationRow: parentRow,
            type: 'sum',
            forceNumeric: true,
            ranges: [[parentRow + 1, parentRow + childCount]],
          });
        }

        return endpoints;
      }}
      height="auto"
    />
  );
};

export default ExampleComponent;
