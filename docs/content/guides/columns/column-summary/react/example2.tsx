import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={[
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        // add an empty row
        [null],
      ]}
      colHeaders={true}
      rowHeaders={true}
      columnSummary={[
        {
          sourceColumn: 0,
          type: 'sum',
          // for this column summary, count row coordinates backward
          reversedRowCoords: true,
          // now, to always display this column summary in the bottom row,
          // set `destinationRow` to `0` (i.e. the last possible row)
          destinationRow: 0,
          destinationColumn: 0,
        },
        {
          sourceColumn: 1,
          type: 'min',
          // for this column summary, count row coordinates backward
          reversedRowCoords: true,
          // now, to always display this column summary in the bottom row,
          // set `destinationRow` to `0` (i.e. the last possible row)
          destinationRow: 0,
          destinationColumn: 1,
        },
      ]}
      height="auto"
    />
  );
};

export default ExampleComponent;
