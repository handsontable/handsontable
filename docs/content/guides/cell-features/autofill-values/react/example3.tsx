import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

// Defined outside the component so autofill can mutate this array in place
// without a re-render (triggered by `setOutput`) resetting it to its initial values.
const data = [
  ['', 'Tesla', 'Nissan', 'Toyota', 'Honda'],
  ['2017', 10, 11, 12, 13],
  ['2018', 20, 11, 14, 13],
  ['2019', 30, 15, 12, 13],
  ['2020', '', '', '', ''],
  ['2021', '', '', '', ''],
];

const ExampleComponent = () => {
  const [output, setOutput] = useState('Drag the fill handle to see the affected range logged here.');

  return (
    <>
      <output className="console" id="output">
        {output}
      </output>
      <HotTable
        data={data}
        rowHeaders={true}
        colHeaders={true}
        fillHandle={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
        beforeAutofill={(selectionData) =>
          // This dealership reports sales in batches of 5 cars, so round every
          // filled value up to the nearest multiple of 5.
          selectionData.map((row) => row.map((value) => (typeof value === 'number' ? Math.ceil(value / 5) * 5 : value)))
        }
        afterAutofill={(fillData, sourceRange, targetRange, direction) => {
          setOutput(
            `Filled rows ${targetRange.from.row}-${targetRange.to.row}, ` +
              `columns ${targetRange.from.col}-${targetRange.to.col} (direction: "${direction}").`
          );
        }}
      />
    </>
  );
};

export default ExampleComponent;
