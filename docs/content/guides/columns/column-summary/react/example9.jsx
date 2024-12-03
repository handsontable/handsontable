import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  //  generate an array of arrays with dummy numeric data
  const generateData = (rows = 3, columns = 7, additionalRows = true) => {
    let counter = 0;
    const array2d = [...new Array(rows)].map((_) =>
      [...new Array(columns)].map((_) => counter++)
    );

    if (additionalRows) {
      array2d.push([]);
      array2d.push([]);
    }

    return array2d;
  };

  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={generateData(5, 7)}
      height="auto"
      colHeaders={true}
      rowHeaders={true}
      columnSummary={[
        // configure a column summary
        {
          // set the `type` option to `'custom'`
          type: 'custom',
          destinationRow: 0,
          destinationColumn: 5,
          reversedRowCoords: true,
          // add your custom summary function
          customFunction(endpoint) {
            // implement a function that counts the number of even values in the column
            const hotInstance = this.hot;
            let evenCount = 0;
            // a helper function
            const checkRange = (rowRange) => {
              let i = rowRange[1] || rowRange[0];
              let counter = 0;

              do {
                if (
                  parseInt(
                    hotInstance.getDataAtCell(i, endpoint.sourceColumn),
                    10
                  ) %
                    2 ===
                  0
                ) {
                  counter++;
                }

                i--;
              } while (i >= rowRange[0]);

              return counter;
            };

            // go through all declared ranges
            for (const r in endpoint.ranges) {
              if (endpoint.ranges.hasOwnProperty(r)) {
                evenCount += checkRange(endpoint.ranges[r]);
              }
            }

            return evenCount;
          },
          forceNumeric: true,
        },
      ]}
    />
  );
};

export default ExampleComponent;
