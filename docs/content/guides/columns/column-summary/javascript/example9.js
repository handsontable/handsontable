import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// generate an array of arrays with dummy numeric data
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

const container = document.querySelector('#example9');

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  // initialize a Handsontable instance with the generated numeric data
  data: generateData(5, 7),
  height: 'auto',
  colHeaders: true,
  rowHeaders: true,
  // enable the `ColumnSummary` plugin
  columnSummary: [
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
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
