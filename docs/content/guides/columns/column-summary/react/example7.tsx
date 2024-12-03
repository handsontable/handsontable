import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import { DetailedSettings } from 'handsontable/plugins/columnSummary';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  //  generate an array of arrays with dummy numeric data
  const generateData = (rows = 3, columns = 7, additionalRows = true) => {
    let counter = 0;

    const array2d = [...new Array(rows)].map((_) =>
      [...new Array(columns)].map((_) => counter++)
    );

    // add an empty row at the bottom, to display column summaries
    if (additionalRows) {
      array2d.push([]);
    }

    return array2d;
  };

  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={generateData(5, 5, true)}
      height="auto"
      rowHeaders={true}
      colHeaders={['sum', 'min', 'max', 'count', 'average']}
      columnSummary={function () {
        const configArray = [];
        const summaryTypes = ['sum', 'min', 'max', 'count', 'average'];

        for (let i = 0; i < this.hot.countCols(); i++) {
          // iterate over visible columns
          // for each visible column, add a column summary with a configuration
          configArray.push({
            sourceColumn: i,
            type: summaryTypes[i],
            // count row coordinates backward
            reversedRowCoords: true,
            // display the column summary in the bottom row (because of the reversed row coordinates)
            destinationRow: 0,
            destinationColumn: i,
            forceNumeric: true,
          });
        }

        return configArray as DetailedSettings[];
      }}
    />
  );
};

export default ExampleComponent;
